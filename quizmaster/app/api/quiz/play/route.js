import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Quiz from "@/models/Quiz";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get("id");

    if (!quizId) {
      return NextResponse.json({ error: "缺少quiz ID" }, { status: 400 });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return NextResponse.json({ error: "题库不存在" }, { status: 404 });
    }

    await Quiz.findByIdAndUpdate(quizId, { $inc: { playCount: 1 } });

    return NextResponse.json({ quiz });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "获取题目失败" }, { status: 500 });
  }
}
