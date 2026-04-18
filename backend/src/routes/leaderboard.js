const express = require("express");
const { pool } = require("../db");
const { leaderboardUsers } = require("../repos");

const router = express.Router();

// GET /api/leaderboard?type=score|coins|games
router.get("/", async (req, res) => {
  try {
    const type = req.query.type || "score";
    const leaders = await leaderboardUsers(pool, type);
    return res.json({ leaders });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "获取排行榜失败" });
  }
});

module.exports = router;
