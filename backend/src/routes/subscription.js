const express = require("express");
const { pool } = require("../db");
const {
  findUserById,
  updateUserById,
  findActiveSubscription,
  createSubscriptionRow,
  cancelLatestActiveSubscription,
  findUserByReferralCode,
} = require("../repos");
const { requireAuth } = require("../middleware/auth");
const {
  getEffectivePremium,
  getCoinMultiplier,
} = require("../domain/user");

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
    const user = await findUserById(pool, req.user.userId);
    if (!user) return res.status(404).json({ error: "用户不存在" });

    const isActive = getEffectivePremium(user);
    const isTrial =
      user.trial_ends_at && new Date() < new Date(user.trial_ends_at);

    const currentSub = await findActiveSubscription(pool, user.id);

    return res.json({
      isPremium: isActive,
      isTrial,
      plan: user.subscription_plan,
      premiumUntil: user.premium_until,
      trialEndsAt: user.trial_ends_at,
      autoRenew: user.subscription_auto_renew,
      totalPremiumDays: user.total_premium_days,
      streakFreezeCount: user.streak_freeze_count,
      loyaltyTier: user.loyalty_tier,
      loyaltyPoints: user.loyalty_points,
      subscription: currentSub,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "获取订阅状态失败" });
  }
});

// POST /api/subscription/subscribe
router.post("/subscribe", requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { plan } = req.body;
    if (!plan || !PLANS[plan]) {
      return res.status(400).json({ error: "无效的订阅方案" });
    }

    let user = await findUserById(pool, req.user.userId);
    if (!user) return res.status(404).json({ error: "用户不存在" });

    const planInfo = PLANS[plan];
    const now = new Date();
    const subActive =
      user.is_premium &&
      user.premium_until &&
      new Date() < new Date(user.premium_until);
    const startDate = subActive ? new Date(user.premium_until) : now;
    const endDate = new Date(
      startDate.getTime() + planInfo.days * 24 * 60 * 60 * 1000
    );

    await client.query("BEGIN");

    const subscription = await createSubscriptionRow(client, {
      userId: user.id,
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
    let newLoyaltyTier = user.loyalty_tier;
    const newLoyaltyPoints = user.loyalty_points + loyaltyPointsEarned;
    if (newLoyaltyPoints >= 2000) newLoyaltyTier = "diamond";
    else if (newLoyaltyPoints >= 1000) newLoyaltyTier = "gold";
    else if (newLoyaltyPoints >= 300) newLoyaltyTier = "silver";

    let newBadges = [...(user.badges || [])];
    if (
      !user.is_premium &&
      !newBadges.find((b) => b.name === "Pro会员" || b.name === "Pro Member")
    ) {
      newBadges.push({ name: "Pro会员", icon: "💎", earnedAt: new Date().toISOString() });
    }

    await client.query(
      `UPDATE users SET
        is_premium = TRUE,
        premium_until = $1,
        subscription_plan = $2,
        subscription_auto_renew = TRUE,
        loyalty_tier = $3,
        badges = $4::jsonb,
        coins = coins + $5,
        streak_freeze_count = streak_freeze_count + $6,
        total_premium_days = total_premium_days + $7,
        loyalty_points = loyalty_points + $8,
        updated_at = now()
      WHERE id = $9`,
      [
        endDate,
        plan,
        newLoyaltyTier,
        JSON.stringify(newBadges),
        planInfo.coins,
        planInfo.streakFreezes,
        planInfo.days,
        loyaltyPointsEarned,
        user.id,
      ]
    );

    await client.query("COMMIT");

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
    await client.query("ROLLBACK").catch(() => {});
    console.error(err);
    return res.status(500).json({ error: "订阅失败" });
  } finally {
    client.release();
  }
});

// POST /api/subscription/cancel
router.post("/cancel", requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { reason } = req.body;
    const user = await findUserById(pool, req.user.userId);
    if (!user) return res.status(404).json({ error: "用户不存在" });

    const active =
      user.is_premium &&
      user.premium_until &&
      new Date() < new Date(user.premium_until);
    if (!active) {
      return res.status(400).json({ error: "没有活跃的订阅" });
    }

    const daysRemaining = Math.ceil(
      (new Date(user.premium_until) - new Date()) / (1000 * 60 * 60 * 24)
    );

    await client.query("BEGIN");
    await cancelLatestActiveSubscription(client, user.id, reason);
    await updateUserById(pool, client, user.id, {
      subscriptionAutoRenew: false,
    });
    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "自动续费已取消，会员到期后将不再续费",
      premiumUntil: user.premium_until,
      daysRemaining,
      lossWarning: {
        coinMultiplier: getCoinMultiplier(user),
        streakFreezes: user.streak_freeze_count,
        dailyPlayLimit: "3次/天",
        streak: user.streak,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(err);
    return res.status(500).json({ error: "取消订阅失败" });
  } finally {
    client.release();
  }
});

// POST /api/subscription/start-trial
router.post("/start-trial", requireAuth, async (req, res) => {
  try {
    const user = await findUserById(pool, req.user.userId);
    if (!user) return res.status(404).json({ error: "用户不存在" });

    if (user.trial_used) {
      return res.status(400).json({ error: "试用已使用过" });
    }

    const subActive =
      user.is_premium &&
      user.premium_until &&
      new Date() < new Date(user.premium_until);
    if (subActive) {
      return res.status(400).json({ error: "已经是会员了" });
    }

    const trialEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE users SET
        trial_used = TRUE,
        trial_ends_at = $1,
        is_premium = TRUE,
        premium_until = $1,
        coins = coins + 100,
        updated_at = now()
      WHERE id = $2`,
      [trialEnd, user.id]
    );

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
    const user = await findUserById(pool, req.user.userId);
    if (!user) return res.status(404).json({ error: "用户不存在" });

    const today = new Date().toISOString().split("T")[0];
    if (user.daily_reward_last_claimed === today) {
      return res.status(400).json({ error: "今日已领取" });
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const isConsecutive = user.daily_reward_last_claimed === yesterday;
    const newStreakDay = isConsecutive ? user.daily_reward_day + 1 : 1;
    const dayInCycle = ((newStreakDay - 1) % 7) + 1;

    const isPro = getEffectivePremium(user);
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

    await pool.query(
      `UPDATE users SET
        daily_reward_day = $1,
        daily_reward_last_claimed = $2,
        daily_reward_streak = $3,
        coins = coins + $4,
        updated_at = now()
      WHERE id = $5`,
      [
        newStreakDay,
        today,
        isConsecutive ? user.daily_reward_streak + 1 : 1,
        coinsEarned,
        user.id,
      ]
    );

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
    const user = await findUserById(pool, req.user.userId);
    if (!user) return res.status(404).json({ error: "用户不存在" });

    if (!getEffectivePremium(user)) {
      return res.status(403).json({ error: "仅限Pro会员使用" });
    }

    if (user.streak_freeze_count <= 0) {
      return res.status(400).json({ error: "没有剩余的连胜保护卡" });
    }

    await pool.query(
      `UPDATE users SET
        streak_freeze_count = streak_freeze_count - 1,
        streak_freeze_used_at = now(),
        last_played_at = now(),
        updated_at = now()
      WHERE id = $1`,
      [user.id]
    );

    return res.json({
      success: true,
      remainingFreezes: user.streak_freeze_count - 1,
      streakProtected: user.streak,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "使用失败" });
  }
});

// POST /api/subscription/referral
router.post("/referral", requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "请输入邀请码" });

    const user = await findUserById(pool, req.user.userId);
    if (!user) return res.status(404).json({ error: "用户不存在" });

    if (user.referred_by) {
      return res.status(400).json({ error: "已经使用过邀请码" });
    }

    const referrer = await findUserByReferralCode(pool, code, user.id);
    if (!referrer) {
      return res.status(404).json({ error: "无效的邀请码" });
    }

    await client.query("BEGIN");
    await client.query(
      `UPDATE users SET referred_by = $1, coins = coins + 200, updated_at = now() WHERE id = $2`,
      [referrer.id, user.id]
    );
    await client.query(
      `UPDATE users SET coins = coins + 300, referral_count = referral_count + 1,
        loyalty_points = loyalty_points + 50, updated_at = now() WHERE id = $1`,
      [referrer.id]
    );
    await client.query("COMMIT");

    return res.json({
      success: true,
      coinsEarned: 200,
      referrerBonus: 300,
      message: "邀请码使用成功！你获得200金币",
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(err);
    return res.status(500).json({ error: "使用邀请码失败" });
  } finally {
    client.release();
  }
});

module.exports = router;
