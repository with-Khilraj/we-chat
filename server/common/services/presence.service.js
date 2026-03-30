const mongoose = require("mongoose");
const redisClient = require("../config/redisClient");
const User = require("../../features/user/user.model");
const Message = require("../../features/chat/message.model");

const PRESENCE_TTL = 24 * 60 * 60; // 24 hours in seconds
const ACTIVE_TAB_TTL = 24 * 60 * 60; // 24 hours in seconds

const presenceKey = (userId) => `presence:${userId}`;
const activeTabKey = (userId) => `active-tab:${userId}`;

class PresenceService {
   // Helper: get all online userIds from redis
  async getOnlineUserIds() {
    const keys = await redisClient.keys('presence:*');
    return keys.map((key) => key.replace('presence:', ''));
  }

  // Handle user coming online (including multi-tab deduplication)
  async handleUserOnline(io, socket, userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Invalid userId:', userId);
      return;
    }
    
    socket.join(userId);

    try {
      // Multi-tab deduplication - check if another tab is already active for this user
      const existingSocketId = await redisClient.get(activeTabKey(userId));

      if (existingSocketId && existingSocketId !== socket.id) {
        // Notify old tab that it has been demoted
        const oldSocket = io.sockets.sockets.get(existingSocketId);
        if (oldSocket) {
          oldSocket.emit('tab-demoted', {
            message: 'Another tab took over the active session.',
            activeSocketId: socket.id,
          });
          console.log(`[Tab Deduplication] Demoted old tab ${existingSocketId} for user ${userId}`);
        }
      }

      // Most recent tab becomes active - overwrite active tab in Redis
      await redisClient.set(activeTabKey(userId), socket.id, 'EX', ACTIVE_TAB_TTL);

      // Redis: store presence with TTL
      await redisClient.set(presenceKey(userId), socket.id, 'EX', PRESENCE_TTL);

      // MongoDB: update lastActive only
      await User.findByIdAndUpdate(userId, { lastActive: new Date() });

      console.log(`[Presence] User ${userId} is now online. Active tab: ${socket.id}`);

      // Emit updated online users to all connected clients
      await this.broadcastOnlineUsers(io);
    } catch (error) {
      console.error("Error updating online-user:", error);
    }
  }

  // Handle user disconnection
  async handleDisconnect(io, socket, activeCallsMap) {
    // Leave all rooms except self
    socket.rooms.forEach((roomId) => {
      if (roomId !== socket.id) socket.leave(roomId);
    });

    try {
      // Find userId by matching socketId in Redis
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
        const activeSocketId = await redisClient.get(activeTabKey(disconnectedUserId));

        if (activeSocketId && activeSocketId !== socket.id) {
          // This was a tab switch, ignore its disconnect
          console.log(`[Tab Dedup] Demoted tab ${socket.id} disconnected - ignoring...`);
          return;
        }

        // Active tab disconnected - clean up presence
        await redisClient.del(presenceKey(disconnectedUserId));
        await redisClient.del(activeTabKey(disconnectedUserId));

        // MongoDB: update lastActive
        await User.findByIdAndUpdate(disconnectedUserId, { lastActive: new Date() });

        // Update status of undelivered messages to 'sent'
        await Message.updateMany(
          { receiverId: disconnectedUserId, status: "delivered" },
          { status: "sent" }
        );
        console.log(`[Presence] User ${disconnectedUserId} is now offline.`);

        // Call Service integration: Clean up active calls
        if (activeCallsMap) {
          for (const [roomId, call] of activeCallsMap.entries()) {
            if (call.callerId === disconnectedUserId || call.receiverId === disconnectedUserId) {
              activeCallsMap.delete(roomId);
              // Notify the other user in the call
              io.to(roomId).emit('call-ended', { roomId });
              console.log(`[Call] Call ${roomId} ended due to user ${disconnectedUserId} disconnection.`);
              break;
            }
          }
        }

        // Emit updated online users list
        await this.broadcastOnlineUsers(io);
      }
    } catch (error) {
      console.error("Error updating user status on disconnect:", error);
    }
  }

  // Broadcast current online users to all clients
  async broadcastOnlineUsers(io) {
    try {
      const onlineUserIds = await this.getOnlineUserIds();
      // Only broadcast valid ObjectIds (length 24)
      io.emit('onlineUsers', onlineUserIds.filter(id => id.length === 24));
    } catch (error) {
      console.error("Error broadcasting online users:", error);
    }
  }

  // Broadcast online users to a single connecting socket
  async emitOnlineUsersToSocket(socket) {
    try {
      const onlineUserIds = await this.getOnlineUserIds();
      socket.emit("onlineUsers", onlineUserIds.filter(id => id.length === 24));
    } catch (error) {
      console.error("Error emitting to socket:", error);
    }
  }
}

module.exports = new PresenceService();
