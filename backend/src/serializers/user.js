const {
  getEffectivePremium,
  getDailyPlayLimit,
  resetDailyPlaysIfNeeded,
} = require("../domain/user");

/** Full client shape (matches prior Mongoose JSON). Call after loading user from DB. */
function toClientUser(user) {
  if (!user) return null;
  resetDailyPlaysIfNeeded(user);
  const isPremium = getEffectivePremium(user);
  const dailyPlayLimit = getDailyPlayLimit(user);
  const today = new Date().toISOString().split("T")[0];
  const canClaimDaily = user.daily_reward_last_claimed !== today;

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    coins: user.coins,
    level: user.level,
    totalScore: user.total_score,
    gamesPlayed: user.games_played,
    gamesWon: user.games_won,
    streak: user.streak,
    maxStreak: user.max_streak,
    badges: user.badges,
    isPremium,
    subscriptionPlan: user.subscription_plan,
    premiumUntil: user.premium_until,
    dailyPlaysUsed: user.daily_plays_used,
    dailyPlayLimit,
    dailyPlaysRemaining: Math.max(0, dailyPlayLimit - user.daily_plays_used),
    referralCode: user.referral_code,
    referralCount: user.referral_count,
    loyaltyTier: user.loyalty_tier,
    loyaltyPoints: user.loyalty_points,
    streakFreezeCount: user.streak_freeze_count,
    canClaimDaily,
    dailyRewardDay: user.daily_reward_day,
    dailyRewardStreak: user.daily_reward_streak,
    trialUsed: user.trial_used,
    trialEndsAt: user.trial_ends_at,
    referredBy: user.referred_by,
  };
}

module.exports = { toClientUser };
