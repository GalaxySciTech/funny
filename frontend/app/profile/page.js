"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiFetch } from "@/lib/api";

const LOYALTY_TIERS = {
  bronze: { icon: "🥉", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  silver: { icon: "🥈", color: "text-slate-300", bg: "bg-slate-400/10 border-slate-400/20" },
  gold: { icon: "🥇", color: "text-gold-400", bg: "bg-gold-500/10 border-gold-500/20" },
  diamond: { icon: "💎", color: "text-brand-400", bg: "bg-brand-500/10 border-brand-500/20" },
};

function ProfileContent() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(searchParams.get("tab") || "stats");
  const [claimingReward, setClaimingReward] = useState(false);
  const [rewardResult, setRewardResult] = useState(null);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [referralInput, setReferralInput] = useState("");
  const [referralMsg, setReferralMsg] = useState(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();
  const p = t.profile;

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) setTab(tabParam);
  }, [searchParams]);

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

  async function claimDailyReward() {
    setClaimingReward(true);
    try {
      const res = await apiFetch("/api/subscription/claim-daily-reward", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setRewardResult(data);
        setUser((u) => ({ ...u, coins: (u.coins || 0) + data.coinsEarned, canClaimDaily: false }));
        setTimeout(() => setRewardResult(null), 5000);
      }
    } catch {}
    setClaimingReward(false);
  }

  async function handleCancelSub() {
    setCancelling(true);
    try {
      const res = await apiFetch("/api/subscription/cancel", {
        method: "POST",
        body: JSON.stringify({ reason: "user_cancelled" }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCancel(false);
        fetchStats();
      }
    } catch {}
    setCancelling(false);
  }

  async function handleReferral() {
    if (!referralInput.trim()) return;
    try {
      const res = await apiFetch("/api/subscription/referral", {
        method: "POST",
        body: JSON.stringify({ code: referralInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setReferralMsg({ type: "success", text: data.message });
        setUser((u) => ({ ...u, coins: (u.coins || 0) + data.coinsEarned }));
      } else {
        setReferralMsg({ type: "error", text: data.error });
      }
    } catch {
      setReferralMsg({ type: "error", text: "网络错误" });
    }
    setTimeout(() => setReferralMsg(null), 5000);
  }

  function copyReferralCode() {
    navigator.clipboard.writeText(user.referralCode || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
  const loyaltyInfo = LOYALTY_TIERS[user.loyaltyTier || "bronze"];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Profile Header */}
        <div className="card p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 to-purple-600/10" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-black text-white shadow-xl ${
              user.isPremium
                ? "bg-gradient-to-br from-gold-400 to-amber-500 shadow-gold-500/30 ring-2 ring-gold-400/50"
                : "bg-gradient-to-br from-brand-400 to-purple-500 shadow-brand-500/30"
            }`}>
              {user.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-3xl font-black text-white">{user.username}</h1>
                <span className="badge badge-blue">Lv.{user.level}</span>
                {user.isPremium && (
                  <span className="text-xs bg-gradient-to-r from-gold-400 to-amber-500 text-slate-900 font-black px-2.5 py-1 rounded-lg shadow-lg shadow-gold-500/20">
                    💎 PRO
                  </span>
                )}
                <span className={`text-xs px-2 py-1 rounded-lg border ${loyaltyInfo.bg} ${loyaltyInfo.color} font-bold`}>
                  {loyaltyInfo.icon} {user.loyaltyTier?.toUpperCase()}
                </span>
              </div>
              <p className="text-slate-400 text-sm mb-4">{user.email}</p>

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
                {!user.isPremium && (
                  <div className="flex items-center gap-1.5 bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-1.5">
                    <span>🎮</span>
                    <span className="text-slate-300 font-bold text-sm">{user.dailyPlaysRemaining}/{user.dailyPlayLimit}</span>
                    <span className="text-slate-500 text-xs">今日剩余</span>
                  </div>
                )}
                {user.streakFreezeCount > 0 && (
                  <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-1.5">
                    <span>🛡️</span>
                    <span className="text-cyan-400 font-bold text-sm">{user.streakFreezeCount}</span>
                    <span className="text-slate-400 text-xs">{p.streakFreezes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

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
        <div className="flex bg-slate-800/60 rounded-2xl p-1.5 mb-8 overflow-x-auto">
          {p.tabs.map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap px-3 ${
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

        {/* Subscription Tab */}
        {tab === "subscription" && (
          <div className="space-y-6 animate-fade-in">
            {/* Daily Reward */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">📅 {p.dailyRewardTitle}</h3>
                {user.isPremium && (
                  <span className="badge badge-gold text-xs">{p.dailyRewardProBonus}</span>
                )}
              </div>

              {/* 7-day calendar */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {[10, 15, 20, 25, 30, 40, 80].map((coins, i) => {
                  const dayNum = ((user.dailyRewardDay || 0) % 7);
                  const isPast = i < dayNum;
                  const isCurrent = i === dayNum && user.canClaimDaily;
                  const multiplier = user.isPremium ? 3 : 1;
                  return (
                    <div
                      key={i}
                      className={`text-center p-2 rounded-xl border text-xs ${
                        isPast
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : isCurrent
                          ? "bg-brand-500/20 border-brand-500/30 text-brand-400 ring-2 ring-brand-500/50 animate-pulse"
                          : "bg-slate-700/30 border-slate-600/30 text-slate-500"
                      }`}
                    >
                      <div className="font-bold">D{i + 1}</div>
                      <div className="text-[10px]">🪙{coins * multiplier}</div>
                      {isPast && <span className="text-[10px]">✓</span>}
                    </div>
                  );
                })}
              </div>

              {rewardResult ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                  <span className="text-emerald-400 font-bold">🎉 +{rewardResult.coinsEarned} 金币！</span>
                  {rewardResult.bonusMessage && (
                    <p className="text-sm text-emerald-400/80 mt-1">{rewardResult.bonusMessage}</p>
                  )}
                </div>
              ) : user.canClaimDaily ? (
                <button
                  onClick={claimDailyReward}
                  disabled={claimingReward}
                  className="btn-primary w-full disabled:opacity-60"
                >
                  {claimingReward ? "⏳..." : p.dailyRewardClaim}
                </button>
              ) : (
                <div className="w-full py-3 rounded-xl font-bold text-sm text-center bg-slate-700/50 text-slate-500">
                  ✅ {p.dailyRewardClaimed}
                </div>
              )}
            </div>

            {/* Subscription Status */}
            <div className="card p-6">
              <h3 className="text-white font-bold text-lg mb-4">💎 {p.subTitle}</h3>

              {user.isPremium ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{p.currentPlan}</span>
                    <span className="text-brand-400 font-bold capitalize">
                      {user.subscriptionPlan === "yearly" ? "年度Pro" : user.subscriptionPlan === "monthly" ? "月度Pro" : "Pro试用"}
                    </span>
                  </div>
                  {user.premiumUntil && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">{p.expiresAt}</span>
                      <span className="text-white font-medium">
                        {new Date(user.premiumUntil).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">金币倍率</span>
                    <span className="text-gold-400 font-bold">
                      {user.subscriptionPlan === "yearly" ? "3x" : "2x"} 🪙
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">{p.streakFreezes}</span>
                    <span className="text-cyan-400 font-bold">🛡️ {user.streakFreezeCount}</span>
                  </div>

                  {/* Loyalty tier */}
                  <div className={`rounded-xl p-4 border ${loyaltyInfo.bg}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{loyaltyInfo.icon}</span>
                        <div>
                          <span className={`font-bold ${loyaltyInfo.color}`}>{p.loyaltyTitle}: {user.loyaltyTier?.toUpperCase()}</span>
                          <p className="text-slate-500 text-xs">{user.loyaltyPoints} {p.loyaltyPoints}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {user.subscriptionPlan !== "free" && (
                    <button
                      onClick={() => setShowCancel(true)}
                      className="w-full py-2 rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      {p.cancelSub}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="text-5xl mb-4">💎</div>
                  <h4 className="text-xl font-bold text-white mb-2">{p.notSubscribed}</h4>
                  <p className="text-slate-400 mb-6">{p.notSubscribedDesc}</p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Link href="/pricing" className="btn-primary">
                      {p.upgradePro}
                    </Link>
                    {!user.trialUsed && (
                      <button
                        onClick={async () => {
                          const res = await apiFetch("/api/subscription/start-trial", { method: "POST" });
                          const data = await res.json();
                          if (data.success) fetchStats();
                        }}
                        className="btn-secondary"
                      >
                        {p.startTrial}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Cancel Confirmation Modal */}
            {showCancel && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                <div className="card p-8 max-w-md w-full animate-scale-in">
                  <div className="text-center mb-6">
                    <div className="text-5xl mb-3">😢</div>
                    <h3 className="text-2xl font-black text-white">{p.cancelTitle}</h3>
                    <p className="text-slate-400 mt-2">{p.cancelDesc}</p>
                  </div>
                  <div className="space-y-2 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <p className="text-red-400 text-sm">{p.cancelLoss1}</p>
                    <p className="text-red-400 text-sm">{p.cancelLoss2.replace("{multiplier}", user.subscriptionPlan === "yearly" ? "3" : "2")}</p>
                    <p className="text-red-400 text-sm">{p.cancelLoss3}</p>
                    <p className="text-red-400 text-sm">{p.cancelLoss4}</p>
                    {user.streak > 0 && (
                      <p className="text-red-400 text-sm font-bold">{p.cancelLoss5.replace("{streak}", user.streak)}</p>
                    )}
                  </div>
                  <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl p-3 mb-6 text-center">
                    <p className="text-gold-400 text-sm font-bold">{p.cancelSpecialOffer}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCancelSub}
                      disabled={cancelling}
                      className="flex-1 py-3 rounded-xl text-sm font-medium text-slate-400 bg-slate-700/50 hover:bg-red-500/20 hover:text-red-400 transition-all disabled:opacity-60"
                    >
                      {cancelling ? "⏳..." : p.cancelConfirm}
                    </button>
                    <button
                      onClick={() => setShowCancel(false)}
                      className="flex-1 btn-primary"
                    >
                      {p.cancelKeep}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Referral Tab */}
        {tab === "referral" && (
          <div className="space-y-6 animate-fade-in">
            <div className="card p-8 text-center">
              <div className="text-5xl mb-4">🎁</div>
              <h3 className="text-2xl font-black text-white mb-2">{p.referralTitle}</h3>
              <p className="text-slate-400 mb-6">{p.referralDesc}</p>

              {/* Your code */}
              <div className="bg-slate-700/50 rounded-xl p-6 mb-6">
                <p className="text-slate-400 text-sm mb-2">{p.yourCode}</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl font-black text-brand-400 tracking-widest">
                    {user.referralCode || "—"}
                  </span>
                  <button
                    onClick={copyReferralCode}
                    className="btn-secondary py-2 px-4 text-sm"
                  >
                    {copied ? "✅ " + p.copied : p.copyCode}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-8 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-black text-brand-400">{user.referralCount || 0}</div>
                  <div className="text-slate-400 text-sm">{p.referralCount}{p.referralUnit}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-gold-400">{(user.referralCount || 0) * 300}</div>
                  <div className="text-slate-400 text-sm">🪙 已赚取</div>
                </div>
              </div>

              <p className="text-slate-500 text-sm">{p.referralReward}</p>
            </div>

            {/* Enter referral code */}
            {!user.referredBy && (
              <div className="card p-6">
                <h4 className="text-white font-bold mb-3">{p.enterCode}</h4>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={referralInput}
                    onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                    placeholder={p.enterCodePlaceholder}
                    className="input-field flex-1"
                    maxLength={10}
                  />
                  <button onClick={handleReferral} className="btn-primary px-6">
                    {p.submitCode}
                  </button>
                </div>
                {referralMsg && (
                  <p className={`text-sm mt-3 ${referralMsg.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                    {referralMsg.text}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-white text-2xl">{t.profile.loading}</div></div>}>
      <ProfileContent />
    </Suspense>
  );
}
