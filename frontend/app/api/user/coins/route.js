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

    await connectDB();
    const { action, amount } = await req.json();

    const user = await User.findById(decoded.userId);
    if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

    if (action === "purchase") {
      // Simulate a coin purchase (in production, integrate Stripe/PayPal)
      await User.findByIdAndUpdate(decoded.userId, {
        $inc: { coins: amount },
      });
      const updatedUser = await User.findById(decoded.userId).select("coins");
      return NextResponse.json({ success: true, coins: updatedUser.coins });
    }

    if (action === "spend") {
      if (user.coins < amount) {
        return NextResponse.json({ error: "金币不足" }, { status: 400 });
      }
      await User.findByIdAndUpdate(decoded.userId, {
        $inc: { coins: -amount },
      });
      const updatedUser = await User.findById(decoded.userId).select("coins");
      return NextResponse.json({ success: true, coins: updatedUser.coins });
    }

    return NextResponse.json({ error: "无效操作" }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
