import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true },
  explanation: { type: String, default: "" },
  points: { type: Number, default: 10 },
});

const QuizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    category: {
      type: String,
      enum: [
        "science",
        "history",
        "geography",
        "sports",
        "entertainment",
        "technology",
        "food",
        "animals",
      ],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    questions: [QuestionSchema],
    timePerQuestion: { type: Number, default: 20 },
    isPremium: { type: Boolean, default: false },
    entryFee: { type: Number, default: 0 },
    maxReward: { type: Number, default: 50 },
    playCount: { type: Number, default: 0 },
    thumbnail: { type: String, default: "" },
    emoji: { type: String, default: "🧠" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Quiz || mongoose.model("Quiz", QuizSchema);
