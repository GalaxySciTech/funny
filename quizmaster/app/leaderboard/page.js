"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

function RankIcon({ rank }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="text-slate-500 font-bold text-lg w-8 text-center">{rank}</span>;
}

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("score");
  const [currentUser, setCurrentUser] = useState(null);
  const { t } = useLanguage();
  const lb = t.leaderboard;

  useEffect(() => {
    fetchLeaders();
    fetchUser();
  }, [activeTab]);

  async function fetchLeaders() {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?type=${activeTab}`);
      const data = await res.json();
      setLeaders(data.leaders || []);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUser() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setCurrentUser(data.user);
    } catch {}
  }

  const tabFields = { score: "totalScore", coins: "coins", games: "gamesPlayed" };
  const fieldKey = tabFields[activeTab] || "totalScore";

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3">{lb.title}</h1>
          <p className="text-slate-400 text-lg">{lb.subtitle}</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-800/60 rounded-2xl p-1.5 mb-8">
          {lb.tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.key
                  ? "bg-brand-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        {!loading && leaders.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-10">
            {[leaders[1], leaders[0], leaders[2]].map((leader, i) => {
              const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
              const heights = ["h-28", "h-36", "h-24"];
              const colors = [
                "from-slate-400 to-slate-500",
                "from-gold-400 to-gold-600",
                "from-orange-400 to-orange-600",
              ];
              if (!leader) return null;

              return (
                <div key={rank} className="flex flex-col items-center gap-2 flex-1 max-w-28">
                  <div className="text-2xl">{rank === 1 ? "👑" : ""}</div>
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${colors[i]} flex items-center justify-center text-xl font-black text-white shadow-lg`}>
                    {leader.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="text-white font-bold text-sm text-center truncate w-full text-center">
                    {leader.username}
                  </div>
                  <div className={`w-full ${heights[i]} bg-gradient-to-t ${colors[i]} rounded-t-xl flex items-center justify-center`}>
                    <span className="text-white font-black text-sm">
                      {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                    </span>
                  </div>
                  <div className="text-slate-400 text-xs font-medium">
                    {(leader[fieldKey] || 0).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full Leaderboard */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-2 animate-spin-slow">⏳</div>
              <p className="text-slate-400">{lb.loading}</p>
            </div>
          ) : leaders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-4">🌟</div>
              <h3 className="text-xl font-bold text-white mb-2">{lb.noPlayers}</h3>
              <p className="text-slate-400 mb-6">{lb.noPlayersDesc}</p>
              <Link href="/quiz" className="btn-primary">{lb.startQuiz}</Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {leaders.map((leader, i) => {
                const isCurrentUser = currentUser && leader._id === currentUser.id;
                return (
                  <div
                    key={leader._id}
                    className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                      isCurrentUser ? "bg-brand-500/10 border-l-4 border-brand-500" : "hover:bg-slate-700/20"
                    }`}
                  >
                    <div className="w-10 flex justify-center shrink-0">
                      <RankIcon rank={i + 1} />
                    </div>

                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white shrink-0 ${
                      i === 0 ? "bg-gradient-to-br from-gold-400 to-gold-600 shadow-lg shadow-gold-500/30" :
                      i === 1 ? "bg-gradient-to-br from-slate-300 to-slate-400" :
                      i === 2 ? "bg-gradient-to-br from-orange-400 to-orange-600" :
                      "bg-gradient-to-br from-brand-400 to-purple-500"
                    }`}>
                      {leader.username?.[0]?.toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold truncate ${isCurrentUser ? "text-brand-300" : "text-white"}`}>
                          {leader.username}
                          {isCurrentUser && <span className="text-brand-400 ml-1">{lb.you}</span>}
                        </span>
                        {leader.badges?.[0] && (
                          <span className="text-sm">{leader.badges[0].icon}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
                        <span>🎮 {leader.gamesPlayed} {lb.gamesPlayed}</span>
                        {leader.streak > 0 && <span>🔥 {leader.streak}{lb.dayStreak}</span>}
                        <span>Lv.{leader.level}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`text-lg font-black ${
                        activeTab === "coins" ? "text-gold-400" :
                        activeTab === "score" ? "text-brand-400" : "text-purple-400"
                      }`}>
                        {(leader[fieldKey] || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">
                        {activeTab === "coins" ? lb.coinsUnit : activeTab === "score" ? lb.scoreUnit : lb.gamesUnit}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA for not logged in */}
        {!currentUser && (
          <div className="mt-8 card p-6 text-center bg-gradient-to-br from-brand-600/20 to-purple-600/20 border-brand-500/30">
            <div className="text-4xl mb-3">🚀</div>
            <h3 className="text-white font-bold text-xl mb-2">{lb.ctaTitle}</h3>
            <p className="text-slate-400 mb-4">{lb.ctaDesc}</p>
            <Link href="/auth?mode=register" className="btn-primary">
              {lb.ctaBtn}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
