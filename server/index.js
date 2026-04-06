import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createRequire } from "module";
import Content from "./models/Content.js";
import authRoutes from "./routes/auth.js";
import contentRoutes from "./routes/content.js";
import watchlistRoutes from "./routes/watchlist.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { contentData } = require("./data.js");

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS with proper origin handling
const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  "http://localhost:5173",
  "http://localhost:3000",
  "https://cyberflix-2-client.onrender.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

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
  const uri = process.env.MONGODB_URI;
  const mongoEnabled = Boolean(uri);
  app.locals.mongoEnabled = mongoEnabled;

  if (!process.env.JWT_SECRET) {
    console.warn("JWT_SECRET is not set. Using a temporary dev secret.");
    process.env.JWT_SECRET = "dev-jwt-secret";
  }

  if (mongoEnabled) {
    await mongoose.connect(uri);
    await ensureContentSeeded();
  } else {
    console.warn("MONGODB_URI is not set. Content will be served from data.js (auth/watchlist disabled).");
  }
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
