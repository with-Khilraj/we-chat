const mongoose = require("mongoose");
const Message = require("../features/chat/message.model");
const presenceService = require("../common/services/presence.service");
const callService = require("../common/services/call.service");

// Registers all socket.io event listeners.
const registerSocketHandlers = (io) => {
  io.on("connection", async (socket) => {
    console.log("A user connected:", socket.id);

    // Presence: emit current online users to the newly connected socket
    await presenceService.emitOnlineUsersToSocket(socket);

    // Chat Room
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

    socket.on("leave-room", (roomId) => {
      socket.leave(roomId);
      console.log(`User left room: ${roomId}`);
    });

    // Messaging
    socket.on("send-message", (data) => {
      try {
        if (
          !mongoose.Types.ObjectId.isValid(data._id) ||
          !mongoose.Types.ObjectId.isValid(data.senderId) ||
          !mongoose.Types.ObjectId.isValid(data.receiverId)
        ) {
          console.error("Invalid ID in send-message event:", data);
          socket.emit("error", { message: "Invalid message or user ID" });
          return;
        }

        io.to(data.roomId).emit("receive-message", data);
        io.to(data.senderId).emit("message-sent", {
          messageId: data.tempId,
          serverId: data._id,
          status: "sent",
        });
        io.to(data.receiverId).emit("message-sent", {
          messageId: data.tempId,
          serverId: data._id,
          status: "sent",
        });
      } catch (error) {
        console.error(`Error sending message to room ${data.roomId}:`, error);
      }
    });

    socket.on("typing", (data) => {
      socket.to(data.roomId).emit("typing", data);
    });

    socket.on("message-seen", async (data) => {
      const { messageIds, roomId } = data;

      if (
        !Array.isArray(messageIds) ||
        messageIds.some((id) => !mongoose.Types.ObjectId.isValid(id))
      ) {
        console.error("Invalid ObjectId in message-seen event:", data);
        return;
      }

      try {
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { status: "seen" }
        );
        io.to(roomId).emit("message-seen", { messageIds, status: "seen" });
      } catch (error) {
        console.error("Error updating message status:", error);
      }
    });

    // Presence
    socket.on("online-user", async (userId) => {
      await presenceService.handleUserOnline(io, socket, userId);
    });
    // WebRTC Call Signaling
    socket.on("initiate-call", async (data) => {
      await callService.handleInitiateCall(io, socket, data);
    });

    socket.on("accept-call", async (data) => {
      await callService.handleAcceptCall(io, socket, data);
    });

    socket.on("reject-call", async (data) => {
      await callService.handleRejectCall(io, socket, data);
    });

    socket.on("end-call", (data) => {
      callService.handleEndCall(io, data);
    });

    socket.on("cancel-call", async (data) => {
      await callService.handleCancelCall(io, socket, data);
    });

    // WebRTC peer signaling - forward to room only
    socket.on("offer", (data) => {
      const { roomId, offer } = data;
      if (!socket.rooms.has(roomId)) return;
      socket.to(roomId).emit("offer", { roomId, offer });
    });

    socket.on("answer", (data) => {
      const { roomId, answer } = data;
      if (!socket.rooms.has(roomId)) return;
      socket.to(roomId).emit("answer", { roomId, answer });
    });

    socket.on("ice-candidate", (data) => {
      const { roomId, candidate } = data;
      if (!socket.rooms.has(roomId)) return;
      socket.to(roomId).emit("ice-candidate", { roomId, candidate });
    });

    // Disconnect
    socket.on("disconnect", async () => {
      await presenceService.handleDisconnect(io, socket, callService.getActiveCalls());
    });
  });
};

module.exports = registerSocketHandlers;
