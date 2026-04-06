import mongoose from "mongoose";

const contentSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    title: { type: String, required: true },
    type: String,
    image: String,
    heroLogo: String,
    runtime: String,
    no_of_episodes: String,
    Release_Date: String,
    Age: String,
    description: String,
    imdb: String,
    rottenTomatoes: String,
    ign: String,
    platforms: [String],
    genres: mongoose.Schema.Types.Mixed,
    reviews: [String],
  },
  { timestamps: true }
);

export default mongoose.model("Content", contentSchema);
