import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import skillRoutes from "./routes/skillRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import Message from "./models/Message.js";

// Config
dotenv.config();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",")
  : ["http://localhost:5173"];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// Health Check Route
app.get("/", (req, res) => {
  res.send("SkillSwap Backend Running");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "SkillSwap API is healthy",
  });
});

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/ai", aiRoutes);

// Socket.IO
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("setup", (userId) => {
    socket.userId = userId;

    onlineUsers.set(userId, socket.id);

    const onlineUserIds = Array.from(onlineUsers.keys());

    io.emit("online users", onlineUserIds);

    console.log("User setup complete:", userId);
  });

  socket.on("new message", async (message) => {
    try {
      await Message.create({
        senderId: message.sender,
        receiverId: message.recipientId,
        content: message.text,
        createdAt: new Date(),
      });

      const recipientSocketId = onlineUsers.get(message.recipientId);

      if (recipientSocketId) {
        io.to(recipientSocketId).emit("message received", message);
      }

      const senderSocketId = onlineUsers.get(message.sender);

      if (senderSocketId) {
        io.to(senderSocketId).emit("message received", message);
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  });

  socket.on("call notification", (notification) => {
    try {
      const recipientSocketId = onlineUsers.get(notification.recipientId);

      if (recipientSocketId) {
        io.to(recipientSocketId).emit("call notification", notification);
      }
    } catch (error) {
      console.error("Error handling call notification:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    if (socket.userId) {
      onlineUsers.delete(socket.userId);

      const onlineUserIds = Array.from(onlineUsers.keys());

      io.emit("online users", onlineUserIds);

      socket.broadcast.emit("user offline", socket.userId);

      console.log("User offline:", socket.userId);
    }
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });
});

// Server
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
