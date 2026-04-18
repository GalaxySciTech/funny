const express = require("express");
const { pool } = require("../db");
const {
  listQuizzes,
  findQuizRowRaw,
  findUserById,
  incrementQuizPlayCount,
  createGameSession,
} = require("../repos");
const { optionalAuth } = require("../middleware/auth");
const {
  getEffectivePremium,
  getDailyPlayLimit,
  getCoinMultiplier,
  resetDailyPlaysIfNeeded,
} = require("../domain/user");

const router = express.Router();

// GET /api/quiz — list quizzes (strips answers)
router.get("/", async (req, res) => {
  try {
    const { category, difficulty } = req.query;

    const filter = {};
    if (category && category !== "all") filter.category = category;
    if (difficulty && difficulty !== "all") filter.difficulty = difficulty;

    const quizzes = await listQuizzes(pool, filter);
    return res.json({ quizzes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "获取题库失败" });
  }
});

// GET /api/quiz/play?id=<quizId>
router.get("/play", optionalAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "缺少quiz ID" });

    const quizRow = await findQuizRowRaw(pool, id);
    if (!quizRow) return res.status(404).json({ error: "题库不存在" });

    if (quizRow.is_premium && !req.user) {
      return res.status(403).json({
        error: "premium_required",
        message: "此题库需要登录才能游玩",
      });
    }

    if (req.user) {
      let user = await findUserById(pool, req.user.userId);
      if (user) {
        const didReset = resetDailyPlaysIfNeeded(user);
        const limit = getDailyPlayLimit(user);

        if (user.daily_plays_used >= limit) {
          return res.status(403).json({
            error: "daily_limit_reached",
            message: "今日免费次数已用完，升级Pro无限畅玩！",
            dailyPlaysUsed: user.daily_plays_used,
            dailyPlayLimit: limit,
            isPremium: getEffectivePremium(user),
          });
        }

        if (didReset) {
          await pool.query(
            `UPDATE users SET daily_plays_used = 0, daily_plays_date = $2, updated_at = now() WHERE id = $1`,
            [user.id, user.daily_plays_date]
          );
        }
      }
    }

    await incrementQuizPlayCount(client, id);

    const questions = quizRow.questions || [];
    const quiz = {
      _id: quizRow.id,
      title: quizRow.title,
      description: quizRow.description,
      category: quizRow.category,
      difficulty: quizRow.difficulty,
      questions,
      timePerQuestion: quizRow.time_per_question,
      isPremium: quizRow.is_premium,
      entryFee: quizRow.entry_fee,
      maxReward: quizRow.max_reward,
      playCount: quizRow.play_count + 1,
      thumbnail: quizRow.thumbnail,
      emoji: quizRow.emoji,
      isActive: quizRow.is_active,
    };

    return res.json({ quiz });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "获取题目失败" });
  } finally {
    client.release();
  }
});

// POST /api/quiz/submit
router.post("/submit", optionalAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { quizId, answers, timeTaken } = req.body;

    if (!quizId || !answers) {
      return res.status(400).json({ error: "缺少必要数据" });
    }

    const quizRow = await findQuizRowRaw(pool, quizId);
    if (!quizRow) return res.status(404).json({ error: "题库不存在" });

    const quizQuestions = quizRow.questions || [];
    let score = 0;
    let correctCount = 0;
    const results = quizQuestions.map((q, i) => {
      const selected = answers[i];
      const isCorrect = selected === q.correctIndex;
      if (isCorrect) {
        score += q.points || 10;
        correctCount++;
      }
      return {
        questionIndex: i,
        selectedOption: selected,
        isCorrect,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        timeSpent: 0,
      };
    });

    const accuracy = Math.round((correctCount / quizQuestions.length) * 100);
    let coinsEarned = 0;
    let coinMultiplier = 1;
    let streakBonus = 0;
    let perfectBonus = 0;
    let premiumBonus = 0;
    let dailyPlaysRemaining = null;

    if (req.user) {
      let user = await findUserById(pool, req.user.userId);
      if (resetDailyPlaysIfNeeded(user)) {
        await pool.query(
          `UPDATE users SET daily_plays_used = 0, daily_plays_date = $2, updated_at = now() WHERE id = $1`,
          [user.id, user.daily_plays_date]
        );
        user = await findUserById(pool, req.user.userId);
      }
      const isPro = getEffectivePremium(user);
      coinMultiplier = getCoinMultiplier(user);

      let baseCoins = Math.round((quizRow.max_reward * accuracy) / 100);

      if (accuracy === 100) {
        perfectBonus = Math.round(quizRow.max_reward * 0.5);
        baseCoins += perfectBonus;
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastPlayed = user.last_played_at ? new Date(user.last_played_at) : null;

      let newStreak = user.streak;
      if (lastPlayed) {
        const lastDay = new Date(
          lastPlayed.getFullYear(),
          lastPlayed.getMonth(),
          lastPlayed.getDate()
        );
        const diff = (today - lastDay) / (1000 * 60 * 60 * 24);
        if (diff === 1) newStreak += 1;
        else if (diff > 1) newStreak = 1;
      } else {
        newStreak = 1;
      }

      streakBonus = Math.min(newStreak * 5, 50);
      baseCoins += streakBonus;

      const preMult = baseCoins * coinMultiplier;
      coinsEarned = preMult;
      premiumBonus = coinsEarned - baseCoins;

      const dailyUsed = user.daily_plays_used + 1;
      const limit = getDailyPlayLimit(user);
      dailyPlaysRemaining = Math.max(0, limit - dailyUsed);

      const newMaxStreak = Math.max(user.max_streak || 0, newStreak);
      const newLevel = Math.floor((user.total_score + score) / 1000) + 1;

      let newBadges = [...(user.badges || [])];
      if (
        newStreak >= 7 &&
        !newBadges.find((b) => b.name === "周连胜" || b.name === "Week Streak")
      ) {
        newBadges.push({ name: "周连胜", icon: "🔥", earnedAt: new Date().toISOString() });
      }
      if (
        user.games_played + 1 >= 50 &&
        !newBadges.find((b) => b.name === "老玩家" || b.name === "Veteran Player")
      ) {
        newBadges.push({ name: "老玩家", icon: "🎮", earnedAt: new Date().toISOString() });
      }
      if (
        accuracy === 100 &&
        !newBadges.find((b) => b.name === "完美答题" || b.name === "Perfect Score")
      ) {
        newBadges.push({ name: "完美答题", icon: "💯", earnedAt: new Date().toISOString() });
      }

      const loyaltyGain = isPro ? 10 : 3;

      await client.query("BEGIN");

      await client.query(
        `UPDATE users SET
          coins = coins + $1,
          total_score = total_score + $2,
          games_played = games_played + 1,
          games_won = games_won + $3,
          loyalty_points = loyalty_points + $4,
          streak = $5,
          max_streak = $6,
          last_played_at = $7,
          level = $8,
          badges = $9::jsonb,
          daily_plays_used = $10,
          daily_plays_date = $11,
          updated_at = now()
        WHERE id = $12`,
        [
          coinsEarned,
          score,
          accuracy >= 60 ? 1 : 0,
          loyaltyGain,
          newStreak,
          newMaxStreak,
          now,
          newLevel,
          JSON.stringify(newBadges),
          dailyUsed,
          user.daily_plays_date,
          req.user.userId,
        ]
      );

      await createGameSession(client, {
        userId: req.user.userId,
        quizId,
        score,
        correctAnswers: correctCount,
        totalQuestions: quizQuestions.length,
        timeTaken: timeTaken || 0,
        coinsEarned,
        answers: results.map((r) => ({
          questionIndex: r.questionIndex,
          selectedOption: r.selectedOption,
          isCorrect: r.isCorrect,
          timeSpent: r.timeSpent,
        })),
      });

      await client.query("COMMIT");
    }

    return res.json({
      score,
      correctCount,
      totalQuestions: quizQuestions.length,
      accuracy,
      coinsEarned,
      coinMultiplier,
      streakBonus,
      perfectBonus,
      premiumBonus,
      dailyPlaysRemaining,
      results,
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(err);
    return res.status(500).json({ error: "提交失败" });
  } finally {
    client.release();
  }
});

module.exports = router;
