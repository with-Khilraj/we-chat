const mongoose = require("mongoose");
const redisClient = require("../config/redisClient");
const User = require("../../features/user/user.model");

const presenceKey = (userId) => `presence:${userId}`;

class CallService {
  constructor() {
    // In-memory maps for call state
    this.activeCalls = new Map();
    this.pendingCallTimeouts = new Map();
  }

  // Handle call initiation
  async handleInitiateCall(io, socket, data) {
    const { callerId, receiverId, roomId, callType } = data;

    // Protect calling yourself
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

    const isCallerBusy = [...this.activeCalls.values()].some(
      call => call.callerId === callerId || call.receiverId === callerId
    );
    const isReceiverBusy = [...this.activeCalls.values()].some(
      call => call.callerId === receiverId || call.receiverId === receiverId
    );

    if (this.activeCalls.has(roomId) || isCallerBusy || isReceiverBusy) {
      socket.emit('call-busy', { receiverId });
      return;
    }

    // Redis: get receiver socket id
    const receiverSocketId = await redisClient.get(presenceKey(receiverId));
    if (!receiverSocketId) {
      socket.emit('call-failed', { message: 'Receiver is offline' });
      return;
    }

    console.log(`[Call] Initiated by ${callerId} to ${receiverId}`);
    socket.join(roomId);

    // Fetch caller details
    try {
      const caller = await User.findById(callerId).select('username avatar');
      const callerPayload = caller
        ? { callerId, roomId, callerUsername: caller.username, callerAvatar: caller.avatar, callType }
        : { callerId, roomId };

      socket.to(receiverSocketId).emit("incoming-call", callerPayload);
    } catch (err) {
      console.error('[Call] Error fetching caller details:', err);
      socket.to(receiverSocketId).emit("incoming-call", { callerId, roomId });
    }

    // Set up 30-second ring timeout
    const callTimeout = setTimeout(() => {
      if (!this.activeCalls.has(roomId)) {
        socket.emit('call-timeout', { roomId });
        io.to(receiverSocketId).emit('call-cancelled', { roomId });
        this.pendingCallTimeouts.delete(roomId);
      }
    }, 30000);

    this.pendingCallTimeouts.set(roomId, callTimeout);
  }

  // Handle call acceptance
  async handleAcceptCall(io, socket, data) {
    const { callerId, receiverId, roomId } = data;

    if (
      !mongoose.Types.ObjectId.isValid(callerId) ||
      !mongoose.Types.ObjectId.isValid(receiverId)
    ) {
      console.error('Invalid user ID in accept-call:', data);
      return;
    }

    console.log(`[Call] Accepted by ${receiverId} from ${callerId}`);

    // Clear the pending timeout
    this._clearPendingTimeout(roomId);

    // Receiver joins the room
    socket.join(roomId);

    // Also make the caller's socket join the room
    const callerSocketId = await redisClient.get(presenceKey(callerId));
    if (callerSocketId) {
      const callerSocket = io.sockets.sockets.get(callerSocketId);
      if (callerSocket) callerSocket.join(roomId);
    }

    // Notify caller
    io.to(callerId).emit('call-accepted', { receiverId, roomId });

    // Store as active call
    this.activeCalls.set(roomId, { callerId, receiverId });
  }

  // Handle call rejection
  async handleRejectCall(io, socket, data) {
    const { callerId, receiverId, roomId } = data;

    if (
      !mongoose.Types.ObjectId.isValid(callerId) ||
      !mongoose.Types.ObjectId.isValid(receiverId)
    ) {
      console.error('Invalid user ID in reject-call:', data);
      return;
    }

    console.log(`[Call] Rejected by ${receiverId} from ${callerId}`);

    this._clearPendingTimeout(roomId);

    socket.to(callerId).emit("call-rejected", { receiverId });
    socket.leave(roomId);

    // Make caller's socket leave too
    const callerSocketId = await redisClient.get(presenceKey(callerId));
    if (callerSocketId) {
      const callerSocket = io.sockets.sockets.get(callerSocketId);
      if (callerSocket) callerSocket.leave(roomId);
    }
  }

  // Handle call end
  handleEndCall(io, data) {
    const { roomId } = data;
    console.log(`[Call] Ended in room ${roomId}`);

    this.activeCalls.delete(roomId);
    this._clearPendingTimeout(roomId);

    io.to(roomId).emit("call-ended", { roomId });
    io.socketsLeave(roomId);
  }

  // Handle call cancellation (caller cancels before receiver picks up)
  async handleCancelCall(io, socket, data) {
    const { receiverId, roomId } = data;

    const receiverSocketId = await redisClient.get(presenceKey(receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('call-cancelled', { roomId });
    }

    this._clearPendingTimeout(roomId);
    socket.leave(roomId);
  }

  // Expose activeCalls map (for presence disconnect use)
  getActiveCalls() {
    return this.activeCalls;
  }

  // Private helpers

  _clearPendingTimeout(roomId) {
    const timeout = this.pendingCallTimeouts.get(roomId);
    if (timeout) {
      clearTimeout(timeout);
      this.pendingCallTimeouts.delete(roomId);
    }
  }
}

module.exports = new CallService();
