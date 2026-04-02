import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Subscription from "@/models/Subscription";

export async function POST(req) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "未登录" }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "无效token" }, { status: 401 });

    const { reason } = await req.json();
    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    if (!user.isSubscriptionActive()) return NextResponse.json({ error: "没有活跃的订阅" }, { status: 400 });

    await Subscription.findOneAndUpdate(
      { userId: user._id, status: "active" },
      { $set: { autoRenew: false, cancelledAt: new Date(), cancelReason: reason || "" } },
      { sort: { createdAt: -1 } }
    );
    await User.findByIdAndUpdate(user._id, { $set: { subscriptionAutoRenew: false } });

    const daysRemaining = Math.ceil((new Date(user.premiumUntil) - new Date()) / 86400000);
    return NextResponse.json({ success: true, premiumUntil: user.premiumUntil, daysRemaining });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "取消失败" }, { status: 500 });
  }
}
