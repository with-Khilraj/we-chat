const mongoose = require("mongoose");
const cors = require("cors");
const express = require("express");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./features/auth/auth.routes");
const chatRoutes = require("./features/chat/chat.routes");
const userRoutes = require("./features/user/user.routes");

const startTokenCleanup = require("./service/tokenCleanup");
const errorHandler = require("./common/middlewares/errorHandler");
const registerSocketHandlers = require("./socket/socketHandler");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// ----------------------------------------------------------------
// HTTP & WebSocket Server
// ----------------------------------------------------------------
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// ----------------------------------------------------------------
// Middleware
// ----------------------------------------------------------------
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible in controllers via req.app.get('io')
app.set("io", io);

// Global Cache Prevention for all API routes
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

// ----------------------------------------------------------------
// HTTP Routes
// ----------------------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

// ----------------------------------------------------------------
// Socket.io — delegate to handler
// ----------------------------------------------------------------
registerSocketHandlers(io);

// ----------------------------------------------------------------
// Global Error Handler (must be last)
// ----------------------------------------------------------------
app.use(errorHandler);

// ----------------------------------------------------------------
// Database & Server Start
// ----------------------------------------------------------------
mongoose
  .connect(process.env.MONGO_URI, { maxPoolSize: 10 })
  .then(() => {
    console.log("MongoDB connected");
    startTokenCleanup();
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  });
