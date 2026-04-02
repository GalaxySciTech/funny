import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Quiz from "@/models/Quiz";
import User from "@/models/User";
import GameSession from "@/models/GameSession";

export async function POST(req) {
  try {
    await connectDB();
    const cookieStore = cookies();
    const token = cookieStore.get("auth_token")?.value;
    const decoded = token ? verifyToken(token) : null;

    const { quizId, answers, timeTaken } = await req.json();

    if (!quizId || !answers) {
      return NextResponse.json({ error: "缺少必要数据" }, { status: 400 });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return NextResponse.json({ error: "题库不存在" }, { status: 404 });
    }

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

    if (decoded) {
      coinsEarned = Math.round(
        (quiz.maxReward * accuracy) / 100 +
          (accuracy === 100 ? quiz.maxReward * 0.5 : 0)
      );

      const user = await User.findById(decoded.userId);
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
        if (diff === 1) {
          newStreak += 1;
        } else if (diff > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      const streakBonus = Math.min(newStreak * 5, 50);
      coinsEarned += streakBonus;

      await User.findByIdAndUpdate(decoded.userId, {
        $inc: {
          coins: coinsEarned,
          totalScore: score,
          gamesPlayed: 1,
          gamesWon: accuracy >= 60 ? 1 : 0,
        },
        $set: {
          streak: newStreak,
          lastPlayedAt: now,
        },
      });

      await GameSession.create({
        userId: decoded.userId,
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

    return NextResponse.json({
      score,
      correctCount,
      totalQuestions: quiz.questions.length,
      accuracy,
      coinsEarned,
      results,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}
