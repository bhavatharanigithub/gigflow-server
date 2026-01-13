// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import connectDB from "./config/db.js";
// import authRoutes from "./routes/authRoutes.js";
// import gigRoutes from "./routes/gigRoutes.js";
// import bidRoutes from "./routes/bidRoutes.js";
// import { createServer } from "http";
// import { Server } from "socket.io";

// dotenv.config();
// connectDB();

// const app = express();

// // Create HTTP server for socket.io
// const server = createServer(app);

// // Socket.io setup
// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:5173", // Frontend URL
//     methods: ["GET", "POST", "PATCH"],
//     credentials: true,
//   },
// });

// // Make io accessible in controllers
// app.set("io", io);

// // Middleware
// app.use(express.json());
// app.use(cookieParser());
// app.use(
//   cors({
//     origin: "http://localhost:5173",
//     credentials: true,
//   })
// );

// // Routes
// app.use("/api/gigs", gigRoutes);
// app.use("/api/bids", bidRoutes);
// app.use("/api/auth", authRoutes);

// // Test route
// app.get("/", (req, res) => {
//   res.send("GigFlow API is running 🚀");
// });

// // Socket.io connection
// io.on("connection", (socket) => {
//   console.log("A user connected:", socket.id);

//   // Join a user-specific room
//   socket.on("joinRoom", (userId) => {
//     socket.join(userId);
//     console.log(`User ${userId} joined room`);
//   });

//   // Alternative event name for compatibility
//   socket.on("join", (userId) => {
//     socket.join(userId);
//     console.log(`User ${userId} joined room`);
//   });

//   socket.on("disconnect", () => {
//     console.log("User disconnected:", socket.id);
//   });
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () =>
//   console.log(`🚀 Server running on port ${PORT}`)
// );

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import gigRoutes from "./routes/gigRoutes.js";
import bidRoutes from "./routes/bidRoutes.js";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();
connectDB();

const app = express();

/* ---------------- ALLOWED ORIGINS ---------------- */
const allowedOrigins = [
  "http://localhost:5173", // Local development
  "https://gig-flow-frontend-mu.vercel.app", // Vercel production
];

/* ---------------- HTTP SERVER ---------------- */
const server = createServer(app);

/* ---------------- SOCKET.IO SETUP ---------------- */
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PATCH"],
    credentials: true,
  },
});

/* Make io available in controllers */
app.set("io", io);

/* ---------------- MIDDLEWARE ---------------- */
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

/* ---------------- ROUTES ---------------- */
app.use("/api/auth", authRoutes);
app.use("/api/gigs", gigRoutes);
app.use("/api/bids", bidRoutes);

/* ---------------- TEST ROUTE ---------------- */
app.get("/", (req, res) => {
  res.send("🚀 GigFlow API is running");
});

/* ---------------- SOCKET EVENTS ---------------- */
io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("joinRoom", (userId) => {
    socket.join(userId);
    console.log(`👤 User joined room: ${userId}`);
  });

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`👤 User joined room (alt): ${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

/* ---------------- SERVER START ---------------- */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

