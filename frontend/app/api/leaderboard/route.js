import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "score";

    let sortField = {};
    if (type === "coins") sortField = { coins: -1 };
    else if (type === "games") sortField = { gamesPlayed: -1 };
    else sortField = { totalScore: -1 };

    const leaders = await User.find({})
      .select("username totalScore coins gamesPlayed gamesWon streak level badges")
      .sort(sortField)
      .limit(50);

    return NextResponse.json({ leaders });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "获取排行榜失败" }, { status: 500 });
  }
}
