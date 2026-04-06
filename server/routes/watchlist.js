import { Router } from "express";
import User from "../models/User.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/", authRequired, async (req, res) => {
  try {
    if (!req.app.locals.mongoEnabled) {
      return res.status(503).json({ error: "MongoDB not configured" });
    }
    const user = await User.findById(req.userId).lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ watchlist: user.watchlist || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load watchlist" });
  }
});

router.put("/", authRequired, async (req, res) => {
  try {
    if (!req.app.locals.mongoEnabled) {
      return res.status(503).json({ error: "MongoDB not configured" });
    }
    const contentId = Number(req.body?.contentId);
    if (Number.isNaN(contentId)) {
      return res.status(400).json({ error: "contentId is required" });
    }
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const list = user.watchlist || [];
    const idx = list.indexOf(contentId);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(contentId);
    }
    user.watchlist = list;
    await user.save();
    res.json({ watchlist: user.watchlist });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update watchlist" });
  }
});

export default router;
