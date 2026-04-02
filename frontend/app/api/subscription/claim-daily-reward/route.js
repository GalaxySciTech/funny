import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "未登录" }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "无效token" }, { status: 401 });

    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

    const today = new Date().toISOString().split("T")[0];
    if (user.dailyRewardLastClaimed === today) {
      return NextResponse.json({ error: "今日已领取" }, { status: 400 });
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
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
      bonusMessage = isPro ? "🎉 7天连签 × Pro 3倍！" : "🎉 7天连签大奖！升级Pro获3倍";
    }

    await User.findByIdAndUpdate(user._id, {
      $set: { dailyRewardDay: newStreakDay, dailyRewardLastClaimed: today, dailyRewardStreak: isConsecutive ? user.dailyRewardStreak + 1 : 1 },
      $inc: { coins: coinsEarned },
    });

    return NextResponse.json({ success: true, coinsEarned, dayInCycle, totalStreak: newStreakDay, multiplier, bonusMessage, isPro });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "领取失败" }, { status: 500 });
  }
}
