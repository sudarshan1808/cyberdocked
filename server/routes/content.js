import { Router } from "express";
import { createRequire } from "module";
import Content from "../models/Content.js";
import Rating from "../models/Rating.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();
const require = createRequire(import.meta.url);
const { contentData } = require("../data.js");

router.get("/", async (req, res) => {
  if (!req.app.locals.mongoEnabled) {
    return res.json([...contentData].sort((a, b) => a.id - b.id));
  }
  try {
    const items = await Content.find().sort({ id: 1 }).lean();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load content" });
  }
});

router.get("/:id", async (req, res) => {
  if (!req.app.locals.mongoEnabled) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const item = contentData.find((x) => Number(x.id) === id);
    if (!item) return res.status(404).json({ error: "Not found" });
    return res.json(item);
  }
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    const item = await Content.findOne({ id }).lean();
    if (!item) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load item" });
  }
});

router.post("/:id/rate", authRequired, async (req, res) => {
  if (!req.app.locals.mongoEnabled) {
    return res.status(400).json({ error: "Ratings require database" });
  }
  try {
    const contentId = Number(req.params.id);
    if (Number.isNaN(contentId)) {
      return res.status(400).json({ error: "Invalid content id" });
    }
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const { ratings } = req.body;
    if (!ratings || typeof ratings !== "object") {
      return res.status(400).json({ error: "Ratings object required" });
    }
    // Validate ratings
    const validKeys = ["action", "comedy", "horror", "thriller", "emotional"];
    for (const key of Object.keys(ratings)) {
      if (!validKeys.includes(key)) {
        return res.status(400).json({ error: `Invalid rating key: ${key}` });
      }
      const val = Number(ratings[key]);
      if (isNaN(val) || val < 0 || val > 100) {
        return res.status(400).json({ error: `Invalid rating value for ${key}: ${ratings[key]}` });
      }
    }
    // Upsert rating
    const rating = await Rating.findOneAndUpdate(
      { userId, contentId },
      { ratings },
      { upsert: true, new: true }
    );
    res.json(rating);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save rating" });
  }
});

router.get("/:id/ratings", async (req, res) => {
  if (!req.app.locals.mongoEnabled) {
    return res.json([]);
  }
  try {
    const contentId = Number(req.params.id);
    if (Number.isNaN(contentId)) {
      return res.status(400).json({ error: "Invalid content id" });
    }
    const ratings = await Rating.find({ contentId }).populate("userId", "username profilePicture").lean();
    res.json(ratings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load ratings" });
  }
});

export default router;
