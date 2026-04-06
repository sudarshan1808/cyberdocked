import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authRequired } from "../middleware/auth.js";
import {
  generateVerificationCode,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../services/emailService.js";

const router = Router();

router.get("/me", authRequired, async (req, res) => {
  try {
    if (!req.app.locals.mongoEnabled) {
      return res.status(503).json({ error: "MongoDB not configured" });
    }
    const user = await User.findById(req.userId)
      .select("username email profilePicture watchlist isEmailVerified")
      .lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture || "/pic.jpg",
      watchlist: user.watchlist || [],
      isEmailVerified: user.isEmailVerified,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load profile" });
  }
});

router.patch("/me", authRequired, async (req, res) => {
  try {
    if (!req.app.locals.mongoEnabled) {
      return res.status(503).json({ error: "MongoDB not configured" });
    }
    const updates = {};
    if (req.body?.profilePicture) {
      updates.profilePicture = String(req.body.profilePicture).trim();
    }
    if (req.body?.username) {
      const username = String(req.body.username).trim().toLowerCase();
      if (!username) {
        return res.status(400).json({ error: "Username cannot be empty" });
      }
      if (await User.findOne({ username, _id: { $ne: req.userId } })) {
        return res.status(409).json({ error: "Username already taken" });
      }
      updates.username = username;
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No profile fields to update" });
    }
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select(
      "username email profilePicture watchlist isEmailVerified"
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      watchlist: user.watchlist || [],
      isEmailVerified: user.isEmailVerified,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.post("/register", async (req, res) => {
  try {
    if (!req.app.locals.mongoEnabled) {
      return res.status(503).json({ error: "MongoDB not configured" });
    }
    const username = String(req.body?.username || "").trim().toLowerCase();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      if (existingEmail.isEmailVerified) {
        return res.status(409).json({ error: "Email already registered" });
      } else {
        // Account exists but not verified - resend verification
        const verificationCode = generateVerificationCode();
        const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        existingEmail.verificationCode = verificationCode;
        existingEmail.verificationCodeExpires = verificationCodeExpires;
        existingEmail.lastVerificationEmailSent = new Date();
        await existingEmail.save();

        // Send verification email
        const emailResult = await sendVerificationEmail(email, verificationCode);

        if (!emailResult.success) {
          console.error("Failed to send verification email:", emailResult.error);
          return res.status(500).json({
            error: "Account exists but verification email could not be sent. Please try again later.",
            emailError: emailResult.error,
          });
        }

        // Generate temporary token for unverified user
        const token = jwt.sign({ userId: existingEmail._id.toString() }, process.env.JWT_SECRET, {
          expiresIn: "7d",
        });

        return res.status(200).json({
          message: "Account already exists but not verified. Verification email sent. Please check your inbox.",
          token,
          user: {
            id: existingEmail._id,
            username: existingEmail.username,
            email: existingEmail.email,
            isEmailVerified: false,
          },
        });
      }
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ error: "Username already taken" });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      passwordHash,
      verificationCode,
      verificationCodeExpires,
      lastVerificationEmailSent: new Date(),
    });

    // Send verification email
    const emailResult = await sendVerificationEmail(email, verificationCode);

    if (!emailResult.success) {
      console.error("Failed to send verification email:", emailResult.error);
      // Still create user but warn about email issue
      return res.status(201).json({
        message: "Account created but verification email could not be sent. Please try resending.",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isEmailVerified: false,
        },
        emailError: emailResult.error,
      });
    }

    // Generate temporary token for unverified user
    const token = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "Registration successful. Please verify your email to complete signup.",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        watchlist: user.watchlist,
        isEmailVerified: false,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Verify email with code
router.post("/verify-email", authRequired, async (req, res) => {
  try {
    if (!req.app.locals.mongoEnabled) {
      return res.status(503).json({ error: "MongoDB not configured" });
    }

    const { verificationCode } = req.body;

    if (!verificationCode) {
      return res.status(400).json({ error: "Verification code is required" });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: "Email is already verified" });
    }

    // Check if code is expired
    if (!user.verificationCodeExpires || new Date() > user.verificationCodeExpires) {
      return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
    }

    // Check if code is correct
    if (user.verificationCode !== verificationCode) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    // Send welcome email
    await sendWelcomeEmail(user.email, user.username);

    res.json({
      message: "Email verified successfully!",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: true,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Email verification failed" });
  }
});

// Resend verification email
router.post("/resend-verification-email", authRequired, async (req, res) => {
  try {
    if (!req.app.locals.mongoEnabled) {
      return res.status(503).json({ error: "MongoDB not configured" });
    }

    console.log(`[RESEND] Request from user: ${req.userId}`);

    const user = await User.findById(req.userId);

    if (!user) {
      console.log(`[RESEND] User not found: ${req.userId}`);
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isEmailVerified) {
      console.log(`[RESEND] Email already verified: ${user.email}`);
      return res.status(400).json({ error: "Email is already verified" });
    }

    // Check rate limiting - don't allow resend more than once per minute
    const timeSinceLastEmail = user.lastVerificationEmailSent ? 
      Date.now() - user.lastVerificationEmailSent.getTime() : 0;
    
    if (timeSinceLastEmail < 60 * 1000) {
      const secondsLeft = Math.ceil((60 * 1000 - timeSinceLastEmail) / 1000);
      console.log(`[RESEND] Rate limited for ${user.email}. Wait ${secondsLeft}s`);
      return res.status(429).json({ 
        error: `Please wait ${secondsLeft} seconds before requesting another verification email` 
      });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log(`[RESEND] Generating new code for ${user.email}`);
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    user.lastVerificationEmailSent = new Date();
    await user.save();

    // Send verification email
    console.log(`[RESEND] Sending email to ${user.email}...`);
    const emailResult = await sendVerificationEmail(user.email, verificationCode);

    if (!emailResult.success) {
      console.error(`[RESEND] Failed to send email: ${emailResult.error}`);
      return res.status(500).json({ error: `Failed to send verification email: ${emailResult.error}` });
    }

    console.log(`[RESEND] ✓ Email sent successfully to ${user.email}`);
    res.json({
      message: "Verification email sent successfully. Check your inbox.",
    });
  } catch (err) {
    console.error(`[RESEND] Exception:`, err);
    res.status(500).json({ error: "Failed to resend verification email" });
  }
});

router.post("/login", async (req, res) => {
  try {
    if (!req.app.locals.mongoEnabled) {
      return res.status(503).json({ error: "MongoDB not configured" });
    }
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        error: "Please verify your email before logging in",
        userId: user._id,
        requiresVerification: true,
      });
    }

    const token = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        watchlist: user.watchlist,
        isEmailVerified: true,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;
