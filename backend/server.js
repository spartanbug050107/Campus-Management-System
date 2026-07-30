import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/db.js";

import authRoutes from "./routes/auth.route.js";
import grievanceRoutes from "./routes/grievance.route.js";
import courseRoutes from "./routes/course.route.js";
import attendanceRoutes from "./routes/attendance.route.js";
import resourceRoutes from "./routes/resource.routes.js";
import assignmentRoutes from "./routes/assignment.route.js";
import submissionRoutes from "./routes/submission.route.js";
import calendarRoutes from "./routes/calendar.route.js";
import opportunityRoutes from "./routes/opportunity.route.js";
import userRoutes from "./routes/user.route.js";
import chatbotRoutes from "./routes/chatbot.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (Render/Railway)
app.set("trust proxy", 1);

// Create upload folders if they don't exist
[
  "uploads",
  "uploads/resources",
  "uploads/assignments",
  "uploads/submissions",
].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Security
app.use(helmet());
app.use(compression());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
  })
);

app.use(morgan("combined"));

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Middleware
app.use(express.json());
app.use(cookieParser());

// Static uploads
app.use("/uploads", express.static("uploads"));

// Health Route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/grievances", grievanceRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/assignment", assignmentRoutes);
app.use("/api/submit", submissionRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chatbot", chatbotRoutes);

// 404 for unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
});

// Connect DB and Start Server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });