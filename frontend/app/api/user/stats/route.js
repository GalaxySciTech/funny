import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import GameSession from "@/models/GameSession";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: "无效token" }, { status: 401 });

    await connectDB();
    const user = await User.findById(decoded.userId).select("-password");
    const recentSessions = await GameSession.find({ userId: decoded.userId })
      .populate("quizId", "title category emoji")
      .sort({ completedAt: -1 })
      .limit(10);

    return NextResponse.json({ user, recentSessions });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "获取统计失败" }, { status: 500 });
  }
}
