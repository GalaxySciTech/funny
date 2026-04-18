const express = require("express");
const { pool } = require("../db");
const { findUserById, listRecentSessions } = require("../repos");
const { requireAuth } = require("../middleware/auth");
const { toClientUser } = require("../serializers/user");
const { resetDailyPlaysIfNeeded } = require("../domain/user");

const router = express.Router();

// GET /api/user/stats
router.get("/stats", requireAuth, async (req, res) => {
  try {
    let user = await findUserById(pool, req.user.userId);
    if (!user) return res.status(404).json({ error: "用户不存在" });

    if (resetDailyPlaysIfNeeded(user)) {
      await pool.query(
        `UPDATE users SET daily_plays_used = 0, daily_plays_date = $2, updated_at = now() WHERE id = $1`,
        [user.id, new Date().toISOString().split("T")[0]]
      );
      user = await findUserById(pool, req.user.userId);
    }

    const recentSessions = await listRecentSessions(pool, req.user.userId, 10);

    const mappedSessions = recentSessions.map((s) => ({
      _id: s._id,
      userId: s.userId,
      score: s.score,
      correctAnswers: s.correctAnswers,
      totalQuestions: s.totalQuestions,
      timeTaken: s.timeTaken,
      coinsEarned: s.coinsEarned,
      answers: s.answers,
      completedAt: s.completedAt,
      quizId: {
        _id: s.quizId,
        title: s.quizId_populated.title,
        category: s.quizId_populated.category,
        emoji: s.quizId_populated.emoji,
      },
    }));

    return res.json({ user: toClientUser(user), recentSessions: mappedSessions });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "获取统计失败" });
  }
});

// POST /api/user/coins
router.post("/coins", requireAuth, async (req, res) => {
  try {
    const { action, amount } = req.body;

    const user = await findUserById(pool, req.user.userId);
    if (!user) return res.status(404).json({ error: "用户不存在" });

    if (action === "purchase") {
      const { rows } = await pool.query(
        `UPDATE users SET coins = coins + $1, updated_at = now() WHERE id = $2 RETURNING coins`,
        [amount, req.user.userId]
      );
      return res.json({ success: true, coins: rows[0].coins });
    }

    if (action === "spend") {
      if (user.coins < amount) {
        return res.status(400).json({ error: "金币不足" });
      }
      const { rows } = await pool.query(
        `UPDATE users SET coins = coins - $1, updated_at = now() WHERE id = $2 RETURNING coins`,
        [amount, req.user.userId]
      );
      return res.json({ success: true, coins: rows[0].coins });
    }

    return res.status(400).json({ error: "无效操作" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "操作失败" });
  }
});

module.exports = router;
