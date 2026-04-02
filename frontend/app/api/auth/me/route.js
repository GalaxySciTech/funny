import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ user: null });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ user: null });

    await connectDB();
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return NextResponse.json({ user: null });

    user.resetDailyPlaysIfNeeded();
    const isPremium = user.getEffectivePremium();
    const dailyPlayLimit = user.getDailyPlayLimit();

    const today = new Date().toISOString().split("T")[0];
    const canClaimDaily = user.dailyRewardLastClaimed !== today;

    return NextResponse.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        coins: user.coins,
        level: user.level,
        totalScore: user.totalScore,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
        streak: user.streak,
        maxStreak: user.maxStreak,
        badges: user.badges,
        isPremium,
        subscriptionPlan: user.subscriptionPlan,
        premiumUntil: user.premiumUntil,
        dailyPlaysUsed: user.dailyPlaysUsed,
        dailyPlayLimit,
        dailyPlaysRemaining: Math.max(0, dailyPlayLimit - user.dailyPlaysUsed),
        referralCode: user.referralCode,
        referralCount: user.referralCount,
        loyaltyTier: user.loyaltyTier,
        loyaltyPoints: user.loyaltyPoints,
        streakFreezeCount: user.streakFreezeCount,
        canClaimDaily,
        dailyRewardDay: user.dailyRewardDay,
        dailyRewardStreak: user.dailyRewardStreak,
        trialUsed: user.trialUsed,
        referredBy: user.referredBy,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ user: null });
  }
}
