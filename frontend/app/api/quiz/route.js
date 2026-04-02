import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Quiz from "@/models/Quiz";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");

    let filter = { isActive: true };
    if (category && category !== "all") filter.category = category;
    if (difficulty && difficulty !== "all") filter.difficulty = difficulty;

    const quizzes = await Quiz.find(filter)
      .select("-questions.correctIndex -questions.explanation")
      .sort({ playCount: -1, createdAt: -1 })
      .limit(20);

    return NextResponse.json({ quizzes });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "获取题库失败" }, { status: 500 });
  }
}
