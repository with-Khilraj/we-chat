const mongoose = require("mongoose");
const cors = require("cors");
const express = require("express");
const cookiePaser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const User = require("./models/User");

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
    origin: "http://localhost:3000", // allows request from the origin
    credentials: true, // allow cookies to be sent
  })
);

// Middelware
app.use(cookiePaser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

// using Map to store online users
const onlineUsers = new Map();

// setup socket.io
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Join a room for real-time chat
  socket.on("join-room", (roomId) => {
    try {
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

  // send a message
  socket.on("send-message", (data) => {
    try {
      io.to(data.roomId).emit("receive-message", data);
    } catch (error) {
      console.error(`Error sending message to room ${data.roomId}:`, error);
    }
  });

  socket.on("online-user", async (userId) => {
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
      onlineUsers.set(socket.id, userId);

      //Emit only the newly online user
      socket.broadcast.emit("userStatusChanged", { userId, isOnline: true });
    } catch (error) {
      console.error("Error updating user status:", error);
    }

  });

  socket.on("disconnect", async () => {
    try {
      const userId = onlineUsers.get(socket.id);
      if (userId) {
        // Mark the user as offline when they disconnect
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastActive: new Date(),
        });
        console.log(`User disconnected: ${userId}`);

        // Remove the association from memory
        onlineUsers.delete(socket.id);
        onlineUsers.delete(userId);

        // Emit only the newly offline user
        io.emit("userStatusChanged", { userId, isOnline: false });
      }
    } catch (error) {
      console.error("Error updating user status on disconnect:", error);
    }
  });

});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(`MongoDB connected`);
    server.listen(PORT, () => {
      console.log(`server is running on port ${PORT}`);
    });
  })
  .catch((err) => console.log("Error connecting to MongoDB:", err));
