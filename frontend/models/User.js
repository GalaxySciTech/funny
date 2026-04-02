import mongoose from "mongoose";

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
    password: { type: String, required: true },
    avatar: { type: String, default: "" },
    coins: { type: Number, default: 100 },
    totalScore: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    maxStreak: { type: Number, default: 0 },
    lastPlayedAt: { type: Date, default: null },
    level: { type: Number, default: 1 },
    badges: [{ name: String, icon: String, earnedAt: Date }],
    isPremium: { type: Boolean, default: false },
    premiumUntil: { type: Date, default: null },
    subscriptionPlan: {
      type: String,
      enum: ["free", "monthly", "yearly"],
      default: "free",
    },
    subscriptionAutoRenew: { type: Boolean, default: true },
    totalPremiumDays: { type: Number, default: 0 },
    dailyPlaysUsed: { type: Number, default: 0 },
    dailyPlaysDate: { type: String, default: "" },
    dailyRewardDay: { type: Number, default: 0 },
    dailyRewardLastClaimed: { type: String, default: "" },
    dailyRewardStreak: { type: Number, default: 0 },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    referralCount: { type: Number, default: 0 },
    loyaltyPoints: { type: Number, default: 0 },
    loyaltyTier: {
      type: String,
      enum: ["bronze", "silver", "gold", "diamond"],
      default: "bronze",
    },
    streakFreezeCount: { type: Number, default: 0 },
    streakFreezeUsedAt: { type: Date, default: null },
    trialUsed: { type: Boolean, default: false },
    trialEndsAt: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.virtual("winRate").get(function () {
  if (this.gamesPlayed === 0) return 0;
  return Math.round((this.gamesWon / this.gamesPlayed) * 100);
});

UserSchema.methods.isSubscriptionActive = function () {
  if (!this.isPremium || !this.premiumUntil) return false;
  return new Date() < this.premiumUntil;
};

UserSchema.methods.isTrialActive = function () {
  if (!this.trialEndsAt) return false;
  return new Date() < this.trialEndsAt;
};

UserSchema.methods.getEffectivePremium = function () {
  return this.isSubscriptionActive() || this.isTrialActive();
};

UserSchema.methods.getDailyPlayLimit = function () {
  return this.getEffectivePremium() ? 999 : 3;
};

UserSchema.methods.getCoinMultiplier = function () {
  if (!this.getEffectivePremium()) return 1;
  if (this.subscriptionPlan === "yearly") return 3;
  return 2;
};

UserSchema.methods.resetDailyPlaysIfNeeded = function () {
  const today = new Date().toISOString().split("T")[0];
  if (this.dailyPlaysDate !== today) {
    this.dailyPlaysUsed = 0;
    this.dailyPlaysDate = today;
  }
};

UserSchema.pre("save", function (next) {
  if (!this.referralCode) {
    this.referralCode =
      this.username.toUpperCase().slice(0, 4) +
      Math.random().toString(36).substring(2, 6).toUpperCase();
  }
  next();
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
