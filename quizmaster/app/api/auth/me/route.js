import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ user: null });
    }

    await connectDB();
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return NextResponse.json({ user: null });
    }

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
        badges: user.badges,
        isPremium: user.isPremium,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ user: null });
  }
}
