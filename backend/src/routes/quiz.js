const express = require("express");
const Quiz = require("../models/Quiz");
const User = require("../models/User");
const GameSession = require("../models/GameSession");
const { optionalAuth, requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/quiz — list quizzes (strips answers)
router.get("/", async (req, res) => {
  try {
    const { category, difficulty } = req.query;

    let filter = { isActive: true };
    if (category && category !== "all") filter.category = category;
    if (difficulty && difficulty !== "all") filter.difficulty = difficulty;

    const quizzes = await Quiz.find(filter)
      .select("-questions.correctIndex -questions.explanation")
      .sort({ playCount: -1, createdAt: -1 })
      .limit(20);

    return res.json({ quizzes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "获取题库失败" });
  }
});

// GET /api/quiz/play?id=<quizId> — full quiz for playing (checks daily limit)
router.get("/play", optionalAuth, async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "缺少quiz ID" });

    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ error: "题库不存在" });

    if (quiz.isPremium && !req.user) {
      return res.status(403).json({
        error: "premium_required",
        message: "此题库需要登录才能游玩",
      });
    }

    // Check daily play limit for logged-in free users
    if (req.user) {
      const user = await User.findById(req.user.userId);
      if (user) {
        user.resetDailyPlaysIfNeeded();
        const limit = user.getDailyPlayLimit();

        if (user.dailyPlaysUsed >= limit) {
          return res.status(403).json({
            error: "daily_limit_reached",
            message: "今日免费次数已用完，升级Pro无限畅玩！",
            dailyPlaysUsed: user.dailyPlaysUsed,
            dailyPlayLimit: limit,
            isPremium: user.getEffectivePremium(),
          });
        }

        await user.save();
      }
    }

    await Quiz.findByIdAndUpdate(id, { $inc: { playCount: 1 } });

    return res.json({ quiz });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "获取题目失败" });
  }
});

// POST /api/quiz/submit
router.post("/submit", optionalAuth, async (req, res) => {
  try {
    const { quizId, answers, timeTaken } = req.body;

    if (!quizId || !answers) {
      return res.status(400).json({ error: "缺少必要数据" });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ error: "题库不存在" });

    let score = 0;
    let correctCount = 0;
    const results = quiz.questions.map((q, i) => {
      const selected = answers[i];
      const isCorrect = selected === q.correctIndex;
      if (isCorrect) {
        score += q.points;
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

    const accuracy = Math.round((correctCount / quiz.questions.length) * 100);
    let coinsEarned = 0;
    let coinMultiplier = 1;
    let streakBonus = 0;
    let perfectBonus = 0;
    let premiumBonus = 0;
    let dailyPlaysRemaining = null;

    if (req.user) {
      const user = await User.findById(req.user.userId);
      const isPro = user.getEffectivePremium();
      coinMultiplier = user.getCoinMultiplier();

      // Base coin reward
      let baseCoins = Math.round((quiz.maxReward * accuracy) / 100);

      // Perfect score bonus
      if (accuracy === 100) {
        perfectBonus = Math.round(quiz.maxReward * 0.5);
        baseCoins += perfectBonus;
      }

      // Streak calculation
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastPlayed = user.lastPlayedAt
        ? new Date(
            user.lastPlayedAt.getFullYear(),
            user.lastPlayedAt.getMonth(),
            user.lastPlayedAt.getDate()
          )
        : null;

      let newStreak = user.streak;
      if (lastPlayed) {
        const diff = (today - lastPlayed) / (1000 * 60 * 60 * 24);
        if (diff === 1) newStreak += 1;
        else if (diff > 1) newStreak = 1;
      } else {
        newStreak = 1;
      }

      streakBonus = Math.min(newStreak * 5, 50);
      baseCoins += streakBonus;

      // Apply Pro multiplier
      coinsEarned = baseCoins * coinMultiplier;
      premiumBonus = coinsEarned - baseCoins;

      // Track daily plays
      user.resetDailyPlaysIfNeeded();
      user.dailyPlaysUsed += 1;
      const limit = user.getDailyPlayLimit();
      dailyPlaysRemaining = Math.max(0, limit - user.dailyPlaysUsed);

      // Update max streak
      const newMaxStreak = Math.max(user.maxStreak || 0, newStreak);

      // Level up check (every 1000 score)
      const newLevel = Math.floor((user.totalScore + score) / 1000) + 1;

      // Badge checks
      const newBadges = [...user.badges];
      if (
        newStreak >= 7 &&
        !newBadges.find((b) => b.name === "周连胜" || b.name === "Week Streak")
      ) {
        newBadges.push({ name: "周连胜", icon: "🔥", earnedAt: new Date() });
      }
      if (
        user.gamesPlayed + 1 >= 50 &&
        !newBadges.find(
          (b) => b.name === "老玩家" || b.name === "Veteran Player"
        )
      ) {
        newBadges.push({ name: "老玩家", icon: "🎮", earnedAt: new Date() });
      }
      if (
        accuracy === 100 &&
        !newBadges.find(
          (b) => b.name === "完美答题" || b.name === "Perfect Score"
        )
      ) {
        newBadges.push({ name: "完美答题", icon: "💯", earnedAt: new Date() });
      }

      // Loyalty points for playing
      const loyaltyGain = isPro ? 10 : 3;

      await User.findByIdAndUpdate(req.user.userId, {
        $inc: {
          coins: coinsEarned,
          totalScore: score,
          gamesPlayed: 1,
          gamesWon: accuracy >= 60 ? 1 : 0,
          loyaltyPoints: loyaltyGain,
        },
        $set: {
          streak: newStreak,
          maxStreak: newMaxStreak,
          lastPlayedAt: now,
          level: newLevel,
          badges: newBadges,
          dailyPlaysUsed: user.dailyPlaysUsed,
          dailyPlaysDate: user.dailyPlaysDate,
        },
      });

      await GameSession.create({
        userId: req.user.userId,
        quizId,
        score,
        correctAnswers: correctCount,
        totalQuestions: quiz.questions.length,
        timeTaken: timeTaken || 0,
        coinsEarned,
        answers: results.map((r) => ({
          questionIndex: r.questionIndex,
          selectedOption: r.selectedOption,
          isCorrect: r.isCorrect,
          timeSpent: r.timeSpent,
        })),
      });
    }

    return res.json({
      score,
      correctCount,
      totalQuestions: quiz.questions.length,
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
    console.error(err);
    return res.status(500).json({ error: "提交失败" });
  }
});

module.exports = router;
