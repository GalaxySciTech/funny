const express = require("express");
const User = require("../models/User");

const router = express.Router();

// GET /api/leaderboard?type=score|coins|games
router.get("/", async (req, res) => {
  try {
    const type = req.query.type || "score";

    let sortField = {};
    if (type === "coins") sortField = { coins: -1 };
    else if (type === "games") sortField = { gamesPlayed: -1 };
    else sortField = { totalScore: -1 };

    const leaders = await User.find({})
      .select(
        "username totalScore coins gamesPlayed gamesWon streak level badges isPremium premiumUntil subscriptionPlan loyaltyTier"
      )
      .sort(sortField)
      .limit(50);

    const enriched = leaders.map((u) => ({
      _id: u._id,
      username: u.username,
      totalScore: u.totalScore,
      coins: u.coins,
      gamesPlayed: u.gamesPlayed,
      gamesWon: u.gamesWon,
      streak: u.streak,
      level: u.level,
      badges: u.badges,
      isPremium: u.getEffectivePremium(),
      loyaltyTier: u.loyaltyTier,
      subscriptionPlan: u.subscriptionPlan,
    }));

    return res.json({ leaders: enriched });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "获取排行榜失败" });
  }
});

module.exports = router;
