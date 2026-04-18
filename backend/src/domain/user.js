/** Pure helpers mirroring former Mongoose instance methods (PostgreSQL rows). */

function isSubscriptionActive(user) {
  if (!user.is_premium || !user.premium_until) return false;
  return new Date() < new Date(user.premium_until);
}

function isTrialActive(user) {
  if (!user.trial_ends_at) return false;
  return new Date() < new Date(user.trial_ends_at);
}

function getEffectivePremium(user) {
  return isSubscriptionActive(user) || isTrialActive(user);
}

function getDailyPlayLimit(user) {
  return getEffectivePremium(user) ? 999 : 3;
}

function getCoinMultiplier(user) {
  if (!getEffectivePremium(user)) return 1;
  if (user.subscription_plan === "yearly") return 3;
  return 2;
}

/** Mutates row: resets daily play counters when calendar day changes. */
function resetDailyPlaysIfNeeded(user) {
  const today = new Date().toISOString().split("T")[0];
  if (user.daily_plays_date !== today) {
    user.daily_plays_used = 0;
    user.daily_plays_date = today;
    return true;
  }
  return false;
}

module.exports = {
  isSubscriptionActive,
  isTrialActive,
  getEffectivePremium,
  getDailyPlayLimit,
  getCoinMultiplier,
  resetDailyPlaysIfNeeded,
};
