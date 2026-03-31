const express = require("express");
const User = require("../models/User");
const GameSession = require("../models/GameSession");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/user/stats
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    const recentSessions = await GameSession.find({ userId: req.user.userId })
      .populate("quizId", "title category emoji")
      .sort({ completedAt: -1 })
      .limit(10);

    return res.json({ user, recentSessions });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "获取统计失败" });
  }
});

// POST /api/user/coins
router.post("/coins", requireAuth, async (req, res) => {
  try {
    const { action, amount } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "用户不存在" });

    if (action === "purchase") {
      await User.findByIdAndUpdate(req.user.userId, {
        $inc: { coins: amount },
      });
      const updatedUser = await User.findById(req.user.userId).select("coins");
      return res.json({ success: true, coins: updatedUser.coins });
    }

    if (action === "spend") {
      if (user.coins < amount) {
        return res.status(400).json({ error: "金币不足" });
      }
      await User.findByIdAndUpdate(req.user.userId, {
        $inc: { coins: -amount },
      });
      const updatedUser = await User.findById(req.user.userId).select("coins");
      return res.json({ success: true, coins: updatedUser.coins });
    }

    return res.status(400).json({ error: "无效操作" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "操作失败" });
  }
});

module.exports = router;
