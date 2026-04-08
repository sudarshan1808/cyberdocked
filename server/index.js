import express from "express";
import cors from "cors";
import fs from "fs";                          
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Content from "./models/Content.js";
import authRoutes from "./routes/auth.js";
import contentRoutes from "./routes/content.js";
import watchlistRoutes from "./routes/watchlist.js";
import { contentData } from "./data.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.CLIENT_ORIGIN,
  "https://mern-frontend-latest.onrender.com",
  "https://mern-frontend-rtvi.onrender.com",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`Blocked CORS origin: ${origin}`);
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: false,
  })
);
app.use(express.json({ limit: "1mb" }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get("/", (_req, res) => res.json({ message: "API is running" }));

app.get("/health", (_req, res) => res.json({ status: "OK" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/test", (_req, res) => res.json({ test: "This is a test endpoint", data: [1, 2, 3] }));

// Test email endpoint for debugging (remove in production)
app.post("/api/test-email", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    
    const { sendVerificationEmail } = await import("./services/emailService.js");
    const code = "123456"; // Test code
    const result = await sendVerificationEmail(email, code);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: "Test email sent successfully",
        messageId: result.messageId 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error 
      });
    }
  } catch (err) {
    console.error("Test email error:", err);
    res.status(500).json({ 
      error: err.message || "Failed to send test email" 
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/watchlist", watchlistRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const clientDist = path.join(__dirname, "../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ error: "Not found" });
    }
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

async function ensureContentSeeded() {
  const count = await Content.countDocuments();
  if (count === 0 && contentData?.length) {
    await Content.insertMany(contentData);
    console.log(`Seeded ${contentData.length} content documents`);
  }
}

async function start() {
  const uri = process.env.MONGO_URI;
  const mongoEnabled = Boolean(uri);
  app.locals.mongoEnabled = mongoEnabled;

  if (!process.env.JWT_SECRET) {
    console.warn("JWT_SECRET is not set. Using a temporary dev secret.");
    process.env.JWT_SECRET = "dev-jwt-secret";
  }

  if (mongoEnabled) {
    try {
      await mongoose.connect(uri);
      console.log("✅ MongoDB connected successfully");
      await ensureContentSeeded();
    } catch (error) {
      console.error("❌ MongoDB connection failed:", error.message);
      console.warn("Falling back to data.js for content");
    }
  } else {
    console.warn("MONGO_URI is not set. Content will be served from data.js (auth/watchlist disabled).");
  }
  app.listen(PORT, () => {
    console.log(`🚀 Server started successfully on http://localhost:${PORT}`);
    console.log(`📡 API endpoints available at http://localhost:${PORT}/api/*`);
  });
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
