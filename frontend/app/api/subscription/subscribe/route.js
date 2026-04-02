import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Subscription from "@/models/Subscription";

const PLANS = {
  monthly: { price: 18, currency: "CNY", days: 30, coins: 500, streakFreezes: 2 },
  yearly: { price: 128, currency: "CNY", days: 365, coins: 8000, streakFreezes: 12 },
};

export async function POST(req) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "无效token" }, { status: 401 });

    const { plan } = await req.json();
    if (!plan || !PLANS[plan]) return NextResponse.json({ error: "无效方案" }, { status: 400 });

    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

    const planInfo = PLANS[plan];
    const now = new Date();
    const startDate = user.isSubscriptionActive() ? new Date(user.premiumUntil) : now;
    const endDate = new Date(startDate.getTime() + planInfo.days * 86400000);

    const subscription = await Subscription.create({
      userId: user._id, plan, status: "active", startDate, endDate,
      amountPaid: planInfo.price, originalAmount: planInfo.price, currency: planInfo.currency,
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    });

    const loyaltyPts = plan === "yearly" ? 500 : 100;
    let newTier = user.loyaltyTier;
    const pts = user.loyaltyPoints + loyaltyPts;
    if (pts >= 2000) newTier = "diamond";
    else if (pts >= 1000) newTier = "gold";
    else if (pts >= 300) newTier = "silver";

    const badges = [...user.badges];
    if (!user.isPremium && !badges.find((b) => b.name === "Pro会员")) {
      badges.push({ name: "Pro会员", icon: "💎", earnedAt: new Date() });
    }

    await User.findByIdAndUpdate(user._id, {
      $set: { isPremium: true, premiumUntil: endDate, subscriptionPlan: plan, subscriptionAutoRenew: true, loyaltyTier: newTier, badges },
      $inc: { coins: planInfo.coins, streakFreezeCount: planInfo.streakFreezes, totalPremiumDays: planInfo.days, loyaltyPoints: loyaltyPts },
    });

    return NextResponse.json({ success: true, subscription, bonusCoins: planInfo.coins, streakFreezes: planInfo.streakFreezes, premiumUntil: endDate, loyaltyPointsEarned: loyaltyPts, newLoyaltyTier: newTier });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "订阅失败" }, { status: 500 });
  }
}
