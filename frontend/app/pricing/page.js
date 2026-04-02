"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiFetch } from "@/lib/api";

export default function PricingPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [success, setSuccess] = useState(null);
  const [trialLoading, setTrialLoading] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();
  const pr = t.pricing;

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const res = await apiFetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user);
    } catch {}
    setLoading(false);
  }

  async function handleSubscribe(plan) {
    if (!user) {
      router.push("/auth?mode=register");
      return;
    }
    setSubscribing(plan);
    try {
      const res = await apiFetch("/api/subscription/subscribe", {
        method: "POST",
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess({ plan, ...data });
        setTimeout(() => router.push("/profile?tab=subscription"), 3000);
      }
    } catch {}
    setSubscribing(null);
  }

  async function handleTrial() {
    if (!user) {
      router.push("/auth?mode=register");
      return;
    }
    setTrialLoading(true);
    try {
      const res = await apiFetch("/api/subscription/start-trial", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setSuccess({ plan: "trial", ...data });
        setTimeout(() => router.push("/profile?tab=subscription"), 3000);
      }
    } catch {}
    setTrialLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="card p-10 text-center max-w-md animate-scale-in">
            <div className="text-7xl mb-4">🎉</div>
            <h2 className="text-3xl font-black text-white mb-2">
              {success.plan === "trial" ? "试用已开启！" : "订阅成功！"}
            </h2>
            {success.bonusCoins > 0 && (
              <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl p-4 mb-4">
                <span className="text-gold-400 font-bold text-lg">
                  🪙 +{success.bonusCoins} 金币已到账
                </span>
              </div>
            )}
            {success.streakFreezes > 0 && (
              <p className="text-slate-400">
                🛡️ +{success.streakFreezes} 连胜保护卡
              </p>
            )}
            <p className="text-slate-500 text-sm mt-4">正在跳转到会员中心...</p>
          </div>
        </div>
      </div>
    );
  }

  const isPro = user?.isPremium;
  const currentPlan = user?.subscriptionPlan;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-2 text-brand-300 text-sm font-medium mb-6">
            <span>💎</span> {pr.title}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            {pr.title}
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">{pr.subtitle}</p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Free Plan */}
          <div className="card p-8 relative">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">{pr.freeTitle}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-300">{pr.freePrice}</span>
                <span className="text-slate-500">{pr.freePriceUnit}</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {pr.features.free.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-slate-400 text-sm">
                  <span className="text-slate-600">○</span> {f}
                </li>
              ))}
            </ul>
            {currentPlan === "free" || !user ? (
              <div className="w-full py-3 rounded-xl font-bold text-sm text-center bg-slate-700/50 text-slate-400">
                {!user ? pr.freeTitle : pr.currentPlan}
              </div>
            ) : null}
          </div>

          {/* Monthly Plan */}
          <div className="card p-8 relative ring-2 ring-brand-500 scale-[1.02]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-4 py-1 rounded-full">
              {pr.mostPopular}
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">{pr.monthly}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-brand-400">{pr.monthlyPrice}</span>
                <span className="text-slate-500">{pr.monthlyPriceUnit}</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {pr.features.pro.slice(0, 6).map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                  {f}
                </li>
              ))}
              <li className="text-sm text-brand-400 font-medium">🪙 订阅送500金币 + 2张保护卡</li>
            </ul>
            {currentPlan === "monthly" ? (
              <div className="w-full py-3 rounded-xl font-bold text-sm text-center bg-brand-600/20 text-brand-400 border border-brand-500/30">
                {pr.currentPlan}
              </div>
            ) : (
              <button
                onClick={() => handleSubscribe("monthly")}
                disabled={subscribing === "monthly"}
                className="btn-primary w-full disabled:opacity-60"
              >
                {subscribing === "monthly" ? "⏳..." : pr.subscribe}
              </button>
            )}
          </div>

          {/* Yearly Plan */}
          <div className="card p-8 relative border-gold-500/30">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gold-500 to-amber-500 text-slate-900 text-xs font-black px-4 py-1 rounded-full">
              {pr.bestValue} · {pr.yearlySaving}
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">{pr.yearly}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-gold-400">{pr.yearlyPrice}</span>
                <span className="text-slate-500">{pr.yearlyPriceUnit}</span>
              </div>
              <p className="text-emerald-400 text-sm font-medium mt-1">{pr.yearlyMonthly}</p>
            </div>
            <ul className="space-y-3 mb-8">
              {pr.features.pro.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                  {f}
                </li>
              ))}
              <li className="text-sm text-gold-400 font-bold">🪙 订阅送8000金币 + 12张保护卡</li>
              <li className="text-sm text-gold-400 font-bold">⭐ 金币3倍加成（月卡仅2倍）</li>
            </ul>
            {currentPlan === "yearly" ? (
              <div className="w-full py-3 rounded-xl font-bold text-sm text-center bg-gold-500/20 text-gold-400 border border-gold-500/30">
                {pr.currentPlan}
              </div>
            ) : (
              <button
                onClick={() => handleSubscribe("yearly")}
                disabled={subscribing === "yearly"}
                className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-gold-500 to-amber-500 text-slate-900 hover:from-gold-400 hover:to-amber-400 transition-all hover:-translate-y-0.5 shadow-lg shadow-gold-500/20 disabled:opacity-60"
              >
                {subscribing === "yearly" ? "⏳..." : pr.subscribe}
              </button>
            )}
          </div>
        </div>

        {/* Trial CTA */}
        {user && !isPro && !user?.trialUsed && (
          <div className="text-center mb-16">
            <button
              onClick={handleTrial}
              disabled={trialLoading}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all hover:-translate-y-1 shadow-xl shadow-emerald-500/20 disabled:opacity-60"
            >
              {trialLoading ? "⏳ 开启中..." : pr.trialCta}
            </button>
          </div>
        )}

        {!user && (
          <div className="text-center mb-16">
            <Link
              href="/auth?mode=register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 px-8 rounded-2xl text-lg transition-all hover:-translate-y-1 shadow-xl shadow-emerald-500/20"
            >
              {pr.trialCta}
            </Link>
          </div>
        )}

        {/* Comparison Table (visual) */}
        <div className="card p-8 mb-16 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 text-slate-400 font-medium">功能</th>
                <th className="text-center py-3 text-slate-400 font-medium">免费版</th>
                <th className="text-center py-3 text-brand-400 font-bold">月度Pro</th>
                <th className="text-center py-3 text-gold-400 font-bold">年度Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {[
                ["每日答题次数", "3次", "无限", "无限"],
                ["金币倍率", "1x", "2x", "3x"],
                ["每日签到倍率", "1x", "3x", "3x"],
                ["连胜保护卡", "无", "2张/月", "12张/年"],
                ["Pro徽章", "无", "✓", "✓"],
                ["排行榜Pro标识", "无", "✓", "✓"],
                ["专属题库", "部分", "全部", "全部"],
                ["订阅赠送金币", "—", "500", "8000"],
              ].map(([feature, free, monthly, yearly], i) => (
                <tr key={i} className="hover:bg-slate-700/20">
                  <td className="py-3 text-slate-300">{feature}</td>
                  <td className="py-3 text-center text-slate-500">{free}</td>
                  <td className="py-3 text-center text-brand-400 font-medium">{monthly}</td>
                  <td className="py-3 text-center text-gold-400 font-medium">{yearly}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl font-black text-white text-center mb-8">{pr.faqTitle}</h2>
          <div className="space-y-4">
            {pr.faq.map((item, i) => (
              <div key={i} className="card p-6">
                <h3 className="text-white font-bold mb-2">{item.q}</h3>
                <p className="text-slate-400 text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Guarantee */}
        <div className="text-center text-slate-500 text-sm mb-8">
          {pr.guarantee}
        </div>
      </div>
    </div>
  );
}
