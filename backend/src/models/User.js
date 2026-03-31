const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: { type: String, default: "" },
    coins: { type: Number, default: 100 },
    totalScore: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastPlayedAt: { type: Date, default: null },
    level: { type: Number, default: 1 },
    badges: [
      {
        name: String,
        icon: String,
        earnedAt: Date,
      },
    ],
    isPremium: { type: Boolean, default: false },
    premiumUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.virtual("winRate").get(function () {
  if (this.gamesPlayed === 0) return 0;
  return Math.round((this.gamesWon / this.gamesPlayed) * 100);
});

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
