"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiFetch } from "@/lib/api";

const COIN_PACKAGES = [
  { coins: 500, price: "¥6", bonus: 0, icon: "💰", popular: false },
  { coins: 1200, price: "¥12", bonus: 200, icon: "💎", popular: true },
  { coins: 3000, price: "¥25", bonus: 800, icon: "👑", popular: false },
];

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("stats");
  const [buyLoading, setBuyLoading] = useState(null);
  const [buySuccess, setBuySuccess] = useState(null);
  const router = useRouter();
  const { t } = useLanguage();
  const p = t.profile;

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await apiFetch("/api/user/stats");
      if (res.status === 401) {
        router.push("/auth?mode=login");
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setSessions(data.recentSessions || []);
    } finally {
      setLoading(false);
    }
  }

  async function buyCoins(pkg, idx) {
    setBuyLoading(idx);
    setBuySuccess(null);
    await new Promise((r) => setTimeout(r, 1500));
    try {
      const totalCoins = pkg.coins + pkg.bonus;
      const res = await apiFetch("/api/user/coins", {
        method: "POST",
        body: JSON.stringify({ action: "purchase", amount: totalCoins }),
      });
      const data = await res.json();
      if (data.success) {
        setUser((u) => ({ ...u, coins: data.coins }));
        setBuySuccess(idx);
        setTimeout(() => setBuySuccess(null), 3000);
      }
    } finally {
      setBuyLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-5xl mb-4 animate-bounce">⏳</div>
            <p className="text-white">{p.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const winRate = user.gamesPlayed > 0 ? Math.round((user.gamesWon / user.gamesPlayed) * 100) : 0;
  const levelProgress = ((user.totalScore % 1000) / 1000) * 100;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Profile Header */}
        <div className="card p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 to-purple-600/10" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-4xl font-black text-white shadow-xl shadow-brand-500/30">
              {user.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-3xl font-black text-white">{user.username}</h1>
                <span className="badge badge-blue">Lv.{user.level}</span>
                {user.isPremium && <span className="badge-gold">{p.vip}</span>}
              </div>
              <p className="text-slate-400 text-sm mb-4">{user.email}</p>

              {/* Level Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{p.xp}</span>
                  <span>{user.totalScore % 1000}/1000</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 bg-gold-500/10 border border-gold-500/20 rounded-lg px-3 py-1.5">
                  <span className="text-gold-400">🪙</span>
                  <span className="text-gold-400 font-black">{user.coins?.toLocaleString()}</span>
                  <span className="text-slate-400 text-xs">{p.coins}</span>
                </div>
                {user.streak > 0 && (
                  <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-1.5">
                    <span>🔥</span>
                    <span className="text-orange-400 font-bold">{user.streak}{p.streakUnit}</span>
                    <span className="text-slate-400 text-xs">{p.streak}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Badges */}
          {user.badges?.length > 0 && (
            <div className="relative mt-6 pt-6 border-t border-slate-700/50">
              <p className="text-slate-400 text-sm mb-3 font-medium">{p.badges}</p>
              <div className="flex flex-wrap gap-2">
                {user.badges.map((badge, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-1.5">
                    <span>{badge.icon}</span>
                    <span className="text-white text-sm font-medium">{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-800/60 rounded-2xl p-1.5 mb-8">
          {p.tabs.map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                tab === tabItem.key ? "bg-brand-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              {tabItem.label}
            </button>
          ))}
        </div>

        {/* Stats Tab */}
        {tab === "stats" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
            {[
              { label: p.statsLabels[0], value: user.totalScore?.toLocaleString(), icon: "⭐", color: "text-brand-400" },
              { label: p.statsLabels[1], value: user.gamesPlayed, icon: "🎮", color: "text-purple-400" },
              { label: p.statsLabels[2], value: `${winRate}%`, icon: "🏆", color: "text-gold-400" },
              { label: p.statsLabels[3], value: user.coins?.toLocaleString(), icon: "🪙", color: "text-gold-400" },
            ].map((stat, i) => (
              <div key={i} className="card p-6 text-center hover:scale-105 transition-transform">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className={`text-2xl font-black ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-slate-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* History Tab */}
        {tab === "history" && (
          <div className="card overflow-hidden animate-fade-in">
            {sessions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-5xl mb-4">🎮</div>
                <h3 className="text-xl font-bold text-white mb-2">{p.noHistory}</h3>
                <p className="text-slate-400 mb-6">{p.noHistoryDesc}</p>
                <Link href="/quiz" className="btn-primary">{p.startQuiz}</Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {sessions.map((session, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-700/20 transition-colors">
                    <div className="text-3xl">{session.quizId?.emoji || "🧠"}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{session.quizId?.title || "—"}</p>
                      <p className="text-slate-500 text-sm">
                        {session.correctAnswers}/{session.totalQuestions} {p.correct} ·{" "}
                        {new Date(session.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-brand-400 font-bold">{session.score} {p.score}</div>
                      <div className="text-gold-400 text-sm">+{session.coinsEarned}🪙</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Shop Tab */}
        {tab === "shop" && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="text-4xl mb-2">🛒</div>
              <h2 className="text-2xl font-black text-white mb-1">{p.shopTitle}</h2>
              <p className="text-slate-400">{p.shopDesc}</p>
              <div className="inline-flex items-center gap-2 mt-3 bg-gold-500/10 border border-gold-500/20 rounded-xl px-4 py-2">
                <span className="text-gold-400">🪙</span>
                <span className="text-gold-400 font-black text-lg">{user.coins?.toLocaleString()}</span>
                <span className="text-slate-400 text-sm">{p.currentBalance}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {COIN_PACKAGES.map((pkg, i) => (
                <div key={i} className={`relative card p-8 text-center ${pkg.popular ? "ring-2 ring-brand-500 scale-105" : ""}`}>
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                      {p.mostPopular}
                    </div>
                  )}
                  <div className="text-5xl mb-4">{pkg.icon}</div>
                  <div className="text-4xl font-black text-white mb-1">{pkg.coins.toLocaleString()}</div>
                  {pkg.bonus > 0 && (
                    <div className="badge badge-green mb-3">{p.bonus.replace("{n}", pkg.bonus)}</div>
                  )}
                  <div className="text-slate-400 text-sm mb-4">{p.coinsUnit}</div>
                  <div className="text-3xl font-black text-brand-400 mb-6">{pkg.price}</div>
                  <button
                    onClick={() => buyCoins(pkg, i)}
                    disabled={buyLoading === i}
                    className={`w-full py-3 rounded-xl font-bold transition-all disabled:opacity-60 ${
                      buySuccess === i
                        ? "bg-emerald-600 text-white"
                        : pkg.popular ? "btn-primary" : "btn-secondary"
                    }`}
                  >
                    {buySuccess === i ? p.buySuccess :
                     buyLoading === i ? p.processing : p.buyNow}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 card p-4 text-center text-slate-500 text-sm">
              {p.shopNote}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
