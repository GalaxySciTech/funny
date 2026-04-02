import { NextResponse } from "next/server";

const PLANS = {
  monthly: { price: 18, currency: "CNY", days: 30, coins: 500, streakFreezes: 2, label: "月度会员" },
  yearly: { price: 128, currency: "CNY", days: 365, coins: 8000, streakFreezes: 12, label: "年度会员", savings: 88 },
};

export async function GET() {
  return NextResponse.json({ plans: PLANS });
}
