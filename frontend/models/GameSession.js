import mongoose from "mongoose";

const GameSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    score: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    totalQuestions: { type: Number, required: true },
    timeTaken: { type: Number, default: 0 },
    coinsEarned: { type: Number, default: 0 },
    answers: [
      {
        questionIndex: Number,
        selectedOption: Number,
        isCorrect: Boolean,
        timeSpent: Number,
      },
    ],
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.GameSession ||
  mongoose.model("GameSession", GameSessionSchema);
