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
    if (user.trialUsed) return NextResponse.json({ error: "试用已使用过" }, { status: 400 });
    if (user.isSubscriptionActive()) return NextResponse.json({ error: "已经是会员" }, { status: 400 });

    const trialEnd = new Date(Date.now() + 3 * 86400000);
    await User.findByIdAndUpdate(user._id, {
      $set: { trialUsed: true, trialEndsAt: trialEnd, isPremium: true, premiumUntil: trialEnd },
      $inc: { coins: 100 },
    });

    return NextResponse.json({ success: true, trialEndsAt: trialEnd, bonusCoins: 100 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "开启试用失败" }, { status: 500 });
  }
}
