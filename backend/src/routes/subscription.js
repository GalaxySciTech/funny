const express = require("express");
const User = require("../models/User");
const Subscription = require("../models/Subscription");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const PLANS = {
  monthly: {
    price: 18,
    currency: "CNY",
    days: 30,
    coins: 500,
    streakFreezes: 2,
    label: "月度会员",
  },
  yearly: {
    price: 128,
    currency: "CNY",
    days: 365,
    coins: 8000,
    streakFreezes: 12,
    label: "年度会员",
    savings: 88,
  },
};

// GET /api/subscription/plans
router.get("/plans", (req, res) => {
  return res.json({ plans: PLANS });
});

// GET /api/subscription/status
router.get("/status", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "用户不存在" });

    const isActive = user.getEffectivePremium();
    const isTrial = user.isTrialActive();

    const currentSub = await Subscription.findOne({
      userId: user._id,
      status: "active",
    }).sort({ createdAt: -1 });

    return res.json({
      isPremium: isActive,
      isTrial,
      plan: user.subscriptionPlan,
      premiumUntil: user.premiumUntil,
      trialEndsAt: user.trialEndsAt,
      autoRenew: user.subscriptionAutoRenew,
      totalPremiumDays: user.totalPremiumDays,
      streakFreezeCount: user.streakFreezeCount,
      loyaltyTier: user.loyaltyTier,
      loyaltyPoints: user.loyaltyPoints,
      subscription: currentSub,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "获取订阅状态失败" });
  }
});

// POST /api/subscription/subscribe
router.post("/subscribe", requireAuth, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan || !PLANS[plan]) {
      return res.status(400).json({ error: "无效的订阅方案" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "用户不存在" });

    const planInfo = PLANS[plan];
    const now = new Date();
    const startDate = user.isSubscriptionActive()
      ? new Date(user.premiumUntil)
      : now;
    const endDate = new Date(
      startDate.getTime() + planInfo.days * 24 * 60 * 60 * 1000
    );

    const subscription = await Subscription.create({
      userId: user._id,
      plan,
      status: "active",
      startDate,
      endDate,
      amountPaid: planInfo.price,
      originalAmount: planInfo.price,
      currency: planInfo.currency,
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    });

    const loyaltyPointsEarned = plan === "yearly" ? 500 : 100;
    let newLoyaltyTier = user.loyaltyTier;
    const newLoyaltyPoints = user.loyaltyPoints + loyaltyPointsEarned;
    if (newLoyaltyPoints >= 2000) newLoyaltyTier = "diamond";
    else if (newLoyaltyPoints >= 1000) newLoyaltyTier = "gold";
    else if (newLoyaltyPoints >= 300) newLoyaltyTier = "silver";

    const newBadges = [...user.badges];
    if (
      !user.isPremium &&
      !newBadges.find((b) => b.name === "Pro会员" || b.name === "Pro Member")
    ) {
      newBadges.push({ name: "Pro会员", icon: "💎", earnedAt: new Date() });
    }

    await User.findByIdAndUpdate(user._id, {
      $set: {
        isPremium: true,
        premiumUntil: endDate,
        subscriptionPlan: plan,
        subscriptionAutoRenew: true,
        loyaltyTier: newLoyaltyTier,
        badges: newBadges,
      },
      $inc: {
        coins: planInfo.coins,
        streakFreezeCount: planInfo.streakFreezes,
        totalPremiumDays: planInfo.days,
        loyaltyPoints: loyaltyPointsEarned,
      },
    });

    return res.json({
      success: true,
      subscription,
      bonusCoins: planInfo.coins,
      streakFreezes: planInfo.streakFreezes,
      premiumUntil: endDate,
      loyaltyPointsEarned,
      newLoyaltyTier,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "订阅失败" });
  }
});

// POST /api/subscription/cancel
router.post("/cancel", requireAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "用户不存在" });

    if (!user.isSubscriptionActive()) {
      return res.status(400).json({ error: "没有活跃的订阅" });
    }

    // Calculate what they'll lose
    const daysRemaining = Math.ceil(
      (new Date(user.premiumUntil) - new Date()) / (1000 * 60 * 60 * 24)
    );

    await Subscription.findOneAndUpdate(
      { userId: user._id, status: "active" },
      {
        $set: {
          autoRenew: false,
          cancelledAt: new Date(),
          cancelReason: reason || "",
        },
      },
      { sort: { createdAt: -1 } }
    );

    await User.findByIdAndUpdate(user._id, {
      $set: { subscriptionAutoRenew: false },
    });

    return res.json({
      success: true,
      message: "自动续费已取消，会员到期后将不再续费",
      premiumUntil: user.premiumUntil,
      daysRemaining,
      lossWarning: {
        coinMultiplier: user.getCoinMultiplier(),
        streakFreezes: user.streakFreezeCount,
        dailyPlayLimit: "3次/天",
        streak: user.streak,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "取消订阅失败" });
  }
});

// POST /api/subscription/start-trial
router.post("/start-trial", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "用户不存在" });

    if (user.trialUsed) {
      return res.status(400).json({ error: "试用已使用过" });
    }

    if (user.isSubscriptionActive()) {
      return res.status(400).json({ error: "已经是会员了" });
    }

    const trialEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    await User.findByIdAndUpdate(user._id, {
      $set: {
        trialUsed: true,
        trialEndsAt: trialEnd,
        isPremium: true,
        premiumUntil: trialEnd,
      },
      $inc: { coins: 100 },
    });

    return res.json({
      success: true,
      trialEndsAt: trialEnd,
      bonusCoins: 100,
      message: "3天Pro试用已开启！",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "开启试用失败" });
  }
});

// POST /api/subscription/claim-daily-reward
router.post("/claim-daily-reward", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "用户不存在" });

    const today = new Date().toISOString().split("T")[0];
    if (user.dailyRewardLastClaimed === today) {
      return res.status(400).json({ error: "今日已领取" });
    }

    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];
    const isConsecutive = user.dailyRewardLastClaimed === yesterday;
    const newStreakDay = isConsecutive ? user.dailyRewardDay + 1 : 1;
    const dayInCycle = ((newStreakDay - 1) % 7) + 1;

    const isPro = user.getEffectivePremium();
    const baseRewards = [10, 15, 20, 25, 30, 40, 80];
    const baseCoins = baseRewards[dayInCycle - 1];
    const multiplier = isPro ? 3 : 1;
    const coinsEarned = baseCoins * multiplier;

    let bonusMessage = "";
    if (dayInCycle === 7) {
      bonusMessage = isPro
        ? "🎉 7天连签奖励 × Pro 3倍！"
        : "🎉 7天连签大奖！升级Pro可获得3倍奖励";
    }

    await User.findByIdAndUpdate(user._id, {
      $set: {
        dailyRewardDay: newStreakDay,
        dailyRewardLastClaimed: today,
        dailyRewardStreak: isConsecutive ? user.dailyRewardStreak + 1 : 1,
      },
      $inc: { coins: coinsEarned },
    });

    return res.json({
      success: true,
      coinsEarned,
      dayInCycle,
      totalStreak: newStreakDay,
      multiplier,
      bonusMessage,
      nextReward: baseRewards[dayInCycle % 7] * multiplier,
      isPro,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "领取失败" });
  }
});

// POST /api/subscription/use-streak-freeze
router.post("/use-streak-freeze", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "用户不存在" });

    if (!user.getEffectivePremium()) {
      return res.status(403).json({ error: "仅限Pro会员使用" });
    }

    if (user.streakFreezeCount <= 0) {
      return res.status(400).json({ error: "没有剩余的连胜保护卡" });
    }

    await User.findByIdAndUpdate(user._id, {
      $inc: { streakFreezeCount: -1 },
      $set: { streakFreezeUsedAt: new Date(), lastPlayedAt: new Date() },
    });

    return res.json({
      success: true,
      remainingFreezes: user.streakFreezeCount - 1,
      streakProtected: user.streak,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "使用失败" });
  }
});

// POST /api/subscription/referral
router.post("/referral", requireAuth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "请输入邀请码" });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "用户不存在" });

    if (user.referredBy) {
      return res.status(400).json({ error: "已经使用过邀请码" });
    }

    const referrer = await User.findOne({
      referralCode: code.toUpperCase(),
      _id: { $ne: user._id },
    });
    if (!referrer) {
      return res.status(404).json({ error: "无效的邀请码" });
    }

    await User.findByIdAndUpdate(user._id, {
      $set: { referredBy: referrer._id },
      $inc: { coins: 200 },
    });

    await User.findByIdAndUpdate(referrer._id, {
      $inc: { coins: 300, referralCount: 1, loyaltyPoints: 50 },
    });

    return res.json({
      success: true,
      coinsEarned: 200,
      referrerBonus: 300,
      message: "邀请码使用成功！你获得200金币",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "使用邀请码失败" });
  }
});

module.exports = router;
