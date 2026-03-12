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

const app = express();
require("dotenv").config();

const PORT = process.env.PORT || 5000;

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
    origin: "http://localhost:3000", // allows request from this origin/domain ---> frontend url
    credentials: true, // allow cookies to be sent
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

// using Map to store online users
const onlineUsers = new Map();

// Store active calls
const activeCalls = new Map();

// Store pending call timeouts
const pendingCallTimeouts = new Map();

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

      // update the message status to 'sent' in the database
      // await Message.findByIdAndUpdate(data._id, { status: "sent" });  ----- old way

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

  socket.on("online-user", async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Invalid userId:', userId);
      return;
    }
    socket.join(userId);
    try {
      // Update the user status in the database
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastActive: new Date(),
        socketId: socket.id,
      });
      console.log(`User ${userId} is now online.`);

      // Add the user to the onlineUsers Map
      onlineUsers.set(userId, socket.id);

      //Emit the updated online users list to all the connected users
      io.emit('onlineUsers', Array.from(onlineUsers.keys()));
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
      console.log(`Message seen event emitted for room ${roomId} with messageIds:`, messageIds);
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

    const receiverSocketId = onlineUsers.get(receiverId);
    if (!receiverSocketId) {
      socket.emit('call-failed', { message: 'Receiver is offline' });
      return;
    }

    console.log(`Call initiated by ${callerId} to ${receiverId}`);

    socket.join(roomId); // Join the caller to the room immediately

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
  socket.on('accept-call', (data) => {
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

    // Also make the caller join — find their socket and join too
    const callerSocketId = onlineUsers.get(callerId);
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
  socket.on('reject-call', (data) => {
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

    // leave the call room
    socket.leave(roomId);
    const callerSocketId = onlineUsers.get(callerId);
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
socket.on('cancel-call', ({ callerId, receiverId, roomId }) => {
  const receiverSocketId = onlineUsers.get(receiverId);
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

  socket.on("disconnect", async () => {
    socket.rooms.forEach((roomId) => {
      if (roomId !== socket.id) socket.leave(roomId);
    });

    try {
      // const userId = onlineUsers.get(socket.id);
      const userId = [...onlineUsers.entries()].find(([_, sid]) => sid === socket.id)?.[0];

      if (userId) {
        // Mark the user as offline when they disconnect
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastActive: new Date(),
        });

        // update the user status of undelivered messages to 'sent'
        await Message.updateMany(
          { receiverId: userId, status: "delivered" },
          { status: "sent" }
        );
        console.log(`User disconnected: ${userId}`);

        // Remove the association from memory
        onlineUsers.delete(userId);

        // check if disconnected user was in an active call
        for (const [roomId, call] of activeCalls.entries()) {
          if (call.callerId === userId || call.receiverId === userId) {
            activeCalls.delete(roomId);
            // notify the other user in the call about the disconnection
            io.to(roomId).emit('call-ended', { roomId });
            console.log(`Call ended due to user disconnection.`);
            break;
          }
        }

        //Emit the updated online users list to all the connected users
        io.emit('onlineUsers', Array.from(onlineUsers.keys()));
      }
    } catch (error) {
      console.error("Error updating user status on disconnect:", error);
    }
  });

  // Emit the list of online users to the newly connected user
  socket.emit(
    "onlineUsers",
    Array.from(onlineUsers.keys()).filter((key) => key.length === 24)
  );
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { maxPoolSize: 10 })
  .then(() => {
    console.log(`MongoDB connected`);

    startTokenCleanup(); // Start the token cleanup cron job

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1); // Exit process on failure
  });
