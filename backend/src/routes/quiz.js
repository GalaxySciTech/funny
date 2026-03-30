const express = require("express");
const Quiz = require("../models/Quiz");
const User = require("../models/User");
const GameSession = require("../models/GameSession");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/quiz  — list quizzes (strips answers)
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

// GET /api/quiz/play?id=<quizId>  — full quiz for playing
router.get("/play", async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "缺少quiz ID" });

    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ error: "题库不存在" });

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

    if (req.user) {
      coinsEarned = Math.round(
        (quiz.maxReward * accuracy) / 100 +
          (accuracy === 100 ? quiz.maxReward * 0.5 : 0)
      );

      const user = await User.findById(req.user.userId);
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

      const streakBonus = Math.min(newStreak * 5, 50);
      coinsEarned += streakBonus;

      await User.findByIdAndUpdate(req.user.userId, {
        $inc: {
          coins: coinsEarned,
          totalScore: score,
          gamesPlayed: 1,
          gamesWon: accuracy >= 60 ? 1 : 0,
        },
        $set: { streak: newStreak, lastPlayedAt: now },
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
      results,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "提交失败" });
  }
});

module.exports = router;
