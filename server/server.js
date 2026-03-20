const mongoose = require("mongoose");
const cors = require("cors");
const express = require("express");
const cookiePaser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const chatRoutes = require('./routes/charRoutes')
const User = require("./models/User");
const Message = require("./models/Message");
const startTokenCleanup = require("./service/tokenCleanup");
const redisClient = require("./config/redisClient");

const app = express();
require("dotenv").config();

const PORT = process.env.PORT || 5000;

// Presence Key helper
const presenceKey = (userId) => `presence:${userId}`;
const presence_TTL = 24 * 60 * 60; // 24 hours in seconds

// Active tab key helper
const activeTabKey = (userId) => `active-tab:${userId}`;
const ACTIVE_TAB_TTL = 24 * 60 * 60; // 24 hours in seconds

// create http server
const server = http.createServer(app);

// Apply CORS middleware for websocket connections
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// Apply CORS middleware for the regular http requests
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.set('io', io);

// Middelware
app.use(cookiePaser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/chat", chatRoutes);

// Store active calls
const activeCalls = new Map();

// Store pending call timeouts
const pendingCallTimeouts = new Map();

// Helper: get all online userIds from redis
const getOnlineUserIds = async () => {
  const keys = await redisClient.keys('presence:*');
  return keys.map((key) => key.replace('presence:', ''));
}

// setup socket.io
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Join a room for real-time chat
  socket.on("join-room", (roomId) => {
    try {
      if (!roomId || !/^[0-9a-fA-F]{24}-[0-9a-fA-F]{24}$/.test(roomId)) {
        socket.emit("error", { message: "Invalid room ID" });
        return;
      }
      socket.join(roomId);
      console.log(`User joined room: ${roomId}`);
    } catch (error) {
      console.error(`Error joining room ${roomId}:`, error);
    }
  });

  // leave a room for real-time chat
  socket.on("leave-room", (roomId) => {
    socket.leave(roomId);
    console.log(`User left room: ${roomId}`);
  });

  socket.on('typing', (data) => {
    console.log("Received typing event from client:", data);
    socket.to(data.roomId).emit('typing', data);
  })

  // listen for a message (useChat.js ==> handleSendMessage function)
  socket.on("send-message", async (data) => {
    try {
      // Validate Object fields
      if (
        !mongoose.Types.ObjectId.isValid(data._id) ||
        !mongoose.Types.ObjectId.isValid(data.senderId) ||
        !mongoose.Types.ObjectId.isValid(data.receiverId)
      ) {
        console.error('Invalid ID in send-message event:', data);
        socket.emit("error", { message: "Invalid message or user ID" });
        return;
      }

      // emit the event to the room and individual users
      io.to(data.roomId).emit("receive-message", data);
      io.to(data.senderId).emit("message-sent", {
        messageId: data.tempId, // use tempId for frontend mapping
        serverId: data._id, // Use server-generated ID
        status: "sent"
      });
      io.to(data.receiverId).emit("message-sent", {
        messageId: data.tempId,
        serverId: data._id,
        status: "sent"
      });
    } catch (error) {
      console.error(`Error sending message to room ${data.roomId}:`, error);
    }
  });

  // online presence
  socket.on("online-user", async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Invalid userId:', userId);
      return;
    }
    socket.join(userId);

    try {
      // Mutli-tab deduplication - check if another tab is already active for this user
      const existingSocketId = await redisClient.get(activeTabKey(userId));

      if (existingSocketId && existingSocketId !== socket.id) {
        // Notify old tab that it has been demoted
        const oldSocket = io.sockets.sockets.get(existingSocketId);
        if (oldSocket) {
          oldSocket.emit('tab-demoted', {
            message: 'Another tab took over the active session.',
            activesocketId: socket.id,
          });
          console.log(`[Tab Deduplication] Demoted old tab ${existingSocketId} for user ${userId}`);
        }
      }

      // Most recent tab becomes active - overwrite active tab in Reds
      await redisClient.set(activeTabKey(userId), socket.id, 'EX', ACTIVE_TAB_TTL);

      // Redis: store presence with TTL
      await redisClient.set(presenceKey(userId), socket.id, 'EX', presence_TTL);

      // MongoDB: update lastActive only
      await User.findByIdAndUpdate(userId, { lastActive: new Date() });

      console.log(`[Presence] User ${userId} is now online. Active tab: ${socket.id}`);

      // emit updated online users to all the connected clients
      const onlineUserIds = await getOnlineUserIds();
      io.emit('onlineUsers', onlineUserIds);

    } catch (error) {
      console.error("Invalid updating online-user:", error);
    }
  });

  // handel message seen
  socket.on("message-seen", async (data) => {
    const { messageIds, roomId } = data;

    // Validate all messageIds are valid MongoDB ObjectIds
    if (!Array.isArray(messageIds) || messageIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      console.error('Invalid ObjectId in message-seen event:', data);
      return;
    }

    try {
      // update the message status to seen in the database
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { status: "seen" }
      );
      // emite the event to both sender and receiver
      io.to(roomId).emit('message-seen', { messageIds, status: "seen" });
    } catch (error) {
      console.error("Error updating message status:", error);
    }
  });

  // Handle call initiation
  socket.on('initiate-call', async (data) => {
    const { callerId, receiverId, roomId, callType } = data;

    // protect calling yourself
    if (callerId === receiverId) {
      socket.emit('call-failed', { message: 'Cannot call yourself.' });
      return;
    }

    if (
      !mongoose.Types.ObjectId.isValid(callerId) ||
      !mongoose.Types.ObjectId.isValid(receiverId)
    ) {
      console.error('Invalid user ID in initiate-call:', data);
      return;
    }

    const isCallerBusy = [...activeCalls.values()].some(
      call => call.callerId === callerId || call.receiverId === callerId
    );
    const isReceiverBusy = [...activeCalls.values()].some(
      call => call.callerId === receiverId || call.receiverId === receiverId
    );
    if (activeCalls.has(roomId) || isCallerBusy || isReceiverBusy) {
      socket.emit('call-busy', { receiverId });
      return;
    }

    // Redis: get receive socket id
    const receiverSocketId = await redisClient.get(presenceKey(receiverId));
    if (!receiverSocketId) {
      socket.emit('call-failed', { message: 'Receiver is offline' });
      return;
    }

    console.log(`Call initiated by ${callerId} to ${receiverId}`);

    socket.join(roomId);

    // Fetch caller details to send username and avatar
    try {
      const caller = await User.findById(callerId).select('username avatar');
      if (caller) {
        // notifying the receiver with caller details
        socket.to(receiverSocketId).emit("incoming-call", {
          callerId,
          roomId,
          callerUsername: caller.username,
          callerAvatar: caller.avatar,
          callType,
        });
      } else {
        socket.to(receiverSocketId).emit("incoming-call", { callerId, roomId });
      }
    } catch (err) {
      console.error('Error fetching caller details:', err);
      // Fallback: send just the callerId if fetch fails
      socket.to(receiverSocketId).emit("incoming-call", { callerId, roomId });
    }

    // Set up call timeout
    const callTimeout = setTimeout(() => {
      if (!activeCalls.has(roomId)) {
        socket.emit('call-timeout', { roomId });
        io.to(receiverSocketId).emit('call-cancelled', { roomId });
        // Clean up the timeout
        pendingCallTimeouts.delete(roomId);
      }
    }, 30000); // 30 seconds

    // Store timeout so you can cancel it on accept/reject
    pendingCallTimeouts.set(roomId, callTimeout);
  })

  // Handle call acceptance
  socket.on('accept-call', async (data) => {
    const { callerId, receiverId, roomId } = data;
    if (
      !mongoose.Types.ObjectId.isValid(callerId) ||
      !mongoose.Types.ObjectId.isValid(receiverId)
    ) {
      console.error('Invalid user ID in initiate-call:', data);
      return;
    }

    console.log(`Call accepted by ${receiverId} from ${callerId}`);

    // Clear the pending call timeout
    const callTimeout = pendingCallTimeouts.get(roomId);
    if (callTimeout) {
      clearTimeout(callTimeout);
      pendingCallTimeouts.delete(roomId);
    }

    // Both users must be in the roomId for WebRTC signaling to work
    socket.join(roomId);

    // Redis: get caller socket id
    const callerSocketId = await redisClient.get(presenceKey(callerId));
    if (callerSocketId) {
      const callerSocket = io.sockets.sockets.get(callerSocketId);
      if (callerSocket) callerSocket.join(roomId);
    }

    // notify the caller
    io.to(callerId).emit('call-accepted', { receiverId, roomId });

    // store the call in activeCalls
    activeCalls.set(roomId, { callerId, receiverId });
  })

  // Handle call rejection
  socket.on('reject-call', async (data) => {
    const { callerId, receiverId, roomId } = data;
    if (
      !mongoose.Types.ObjectId.isValid(callerId) ||
      !mongoose.Types.ObjectId.isValid(receiverId)
    ) {
      console.error('Invalid user ID in initiate-call:', data);
      return;
    }

    console.log(`Call rejected by ${receiverId} from ${callerId}`);

    // Clear the pending call timeout
    const callTimeout = pendingCallTimeouts.get(roomId);
    if (callTimeout) {
      clearTimeout(callTimeout);
      pendingCallTimeouts.delete(roomId);
    }

    // notify the caller
    socket.to(callerId).emit("call-rejected", { receiverId });
    socket.leave(roomId);

    // Redis: get caller socket id
    const callerSocketId = await redisClient.get(presenceKey(callerId));
    if (callerSocketId) {
      const callerSocket = io.sockets.sockets.get(callerSocketId);
      if (callerSocket) callerSocket.leave(roomId);
    }
  })

  // Handle call end
  socket.on('end-call', (data) => {
    const { roomId } = data;
    console.log(`Call ended in room ${roomId}`);

    activeCalls.delete(roomId);

    // Clear the pending call timeout
    const callTimeout = pendingCallTimeouts.get(roomId);
    if (callTimeout) {
      clearTimeout(callTimeout);
      pendingCallTimeouts.delete(roomId);
    }

    // Notify the both users
    io.to(roomId).emit("call-ended", { roomId });
    io.socketsLeave(roomId);
  })

  // Handle call cancellation
  socket.on('cancel-call', async ({ callerId, receiverId, roomId }) => {
    const receiverSocketId = await redisClient.get(presenceKey(receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('call-cancelled', { roomId });
    }
    const timeout = pendingCallTimeouts.get(roomId);
    if (timeout) { clearTimeout(timeout); pendingCallTimeouts.delete(roomId); }
    socket.leave(roomId);
  });

  // Handle WebRTC offer
  socket.on('offer', (data) => {
    const { roomId, offer } = data;
    if (!socket.rooms.has(roomId)) reutrn; // Ensure the sender is in the room
    socket.to(roomId).emit('offer', { roomId, offer });
  });

  // Handle WebRTC answer
  socket.on('answer', (data) => {
    const { roomId, answer } = data;
    if (!socket.rooms.has(roomId)) return;
    socket.to(roomId).emit('answer', { roomId, answer });
  });

  // Handle ICE candidates
  socket.on('ice-candidate', (data) => {
    const { roomId, candidate } = data;
    if (!socket.rooms.has(roomId)) return;
    socket.to(roomId).emit('ice-candidate', { roomId, candidate });
  });

  // Handle disconnect (with multi-tab support)
  socket.on("disconnect", async () => {
    socket.rooms.forEach((roomId) => {
      if (roomId !== socket.id) socket.leave(roomId);
    });

    try {
      // find userId by matching socketId in Redis
      const keys = await redisClient.keys('presence:*');
      let disconnectedUserId = null;

      for (const key of keys) {
        const storedSocketId = await redisClient.get(key);
        if (storedSocketId === socket.id) {
          disconnectedUserId = key.replace('presence:', '');
          break;
        }
      }

      if (disconnectedUserId) {
        // Only process disconnect if this socket is the ACTIVE tab
        const activesocketId = await redisClient.get(activeTabKey(disconnectedUserId));

        if (activesocketId && activesocketId !== socket.id) {
          // this was a tab switch, ignore its disconnect
          console.log(`[Tab Dedup] Demoted tab ${socket.id} disconnected - ignoring...`);
          return;
        }

        // Active tab disconnected - clean up presence
        await redisClient.del(presenceKey(disconnectedUserId));
        await redisClient.del(activeTabKey(disconnectedUserId));

        // MongoDB: update lastActive only
        await User.findByIdAndUpdate(disconnectedUserId, { lastActive: new Date() });

        // update the user status of undelivered messages to 'sent'
        await Message.updateMany(
          { receiverId: disconnectedUserId, status: "delivered" },
          { status: "sent" }
        );
        console.log(`[Presence] User ${disconnectedUserId} is now offline.`);

        // check if disconnected user was in an active call
        for (const [roomId, call] of activeCalls.entries()) {
          if (call.callerId === disconnectedUserId || call.receiverId === disconnectedUserId) {
            activeCalls.delete(roomId);
            // notify the other user in the call about the disconnection
            io.to(roomId).emit('call-ended', { roomId });
            console.log(`[Call] Call ${roomId} ended due to user ${disconnectedUserId} disconnection.`);
            break;
          }
        }

        //Emit the updated online users list to all the connected users
        const onlineUserIds = await getOnlineUserIds();
        io.emit('onlineUsers', onlineUserIds);
      }
    } catch (error) {
      console.error("Error updating user status on disconnect:", error);
    }
  });

  // Emit the list of online users to the newly connected user
  (async () => {
    const onlineUserIds = await getOnlineUserIds();
    socket.emit("onlineUsers", onlineUserIds.filter((id) => id.length === 24));
  })();
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { maxPoolSize: 10 })
  .then(() => {
    console.log(`MongoDB connected`);
    startTokenCleanup();
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1); // Exit process on failure
  });
