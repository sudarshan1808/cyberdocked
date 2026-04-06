import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    profilePicture: { type: String, default: "/pic.jpg" },
    watchlist: { type: [Number], default: [] },
    // Email verification fields
    isEmailVerified: { type: Boolean, default: false },
    verificationCode: { type: String, default: null },
    verificationCodeExpires: { type: Date, default: null },
    lastVerificationEmailSent: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
