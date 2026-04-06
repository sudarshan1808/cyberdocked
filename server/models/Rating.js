import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    contentId: { type: Number, required: true },
    ratings: {
      action: { type: Number, min: 0, max: 100, default: 0 },
      comedy: { type: Number, min: 0, max: 100, default: 0 },
      horror: { type: Number, min: 0, max: 100, default: 0 },
      thriller: { type: Number, min: 0, max: 100, default: 0 },
      emotional: { type: Number, min: 0, max: 100, default: 0 },
    },
  },
  { timestamps: true }
);

// Compound index to ensure one rating per user per content
ratingSchema.index({ userId: 1, contentId: 1 }, { unique: true });

export default mongoose.model("Rating", ratingSchema);