import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "未登录" }, { status: 401 });
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "无效token" }, { status: 401 });

    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: "请输入邀请码" }, { status: 400 });

    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    if (user.referredBy) return NextResponse.json({ error: "已经使用过邀请码" }, { status: 400 });

    const referrer = await User.findOne({ referralCode: code.toUpperCase(), _id: { $ne: user._id } });
    if (!referrer) return NextResponse.json({ error: "无效的邀请码" }, { status: 404 });

    await User.findByIdAndUpdate(user._id, { $set: { referredBy: referrer._id }, $inc: { coins: 200 } });
    await User.findByIdAndUpdate(referrer._id, { $inc: { coins: 300, referralCount: 1, loyaltyPoints: 50 } });

    return NextResponse.json({ success: true, coinsEarned: 200, message: "邀请码使用成功！你获得200金币" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "使用邀请码失败" }, { status: 500 });
  }
}
