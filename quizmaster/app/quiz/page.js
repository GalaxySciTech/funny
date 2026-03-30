"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const CATEGORIES = [
  { key: "all", label: "全部", icon: "🌟" },
  { key: "science", label: "科学", icon: "🔬" },
  { key: "history", label: "历史", icon: "📜" },
  { key: "geography", label: "地理", icon: "🌏" },
  { key: "sports", label: "体育", icon: "⚽" },
  { key: "technology", label: "科技", icon: "💻" },
  { key: "entertainment", label: "娱乐", icon: "🎬" },
  { key: "food", label: "美食", icon: "🍜" },
  { key: "animals", label: "动物", icon: "🦁" },
];

const DIFFICULTIES = [
  { key: "all", label: "全部难度" },
  { key: "easy", label: "简单", color: "text-emerald-400" },
  { key: "medium", label: "中等", color: "text-yellow-400" },
  { key: "hard", label: "困难", color: "text-red-400" },
];

function DifficultyBadge({ difficulty }) {
  const map = {
    easy: { label: "简单", cls: "badge-green" },
    medium: { label: "中等", cls: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 badge" },
    hard: { label: "困难", cls: "bg-red-500/20 text-red-400 border border-red-500/30 badge" },
  };
  const d = map[difficulty] || map.medium;
  return <span className={d.cls}>{d.label}</span>;
}

function QuizList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedCat, setSelectedCat] = useState(searchParams.get("category") || "all");
  const [selectedDiff, setSelectedDiff] = useState("all");

  useEffect(() => {
    fetchUser();
    fetchQuizzes();
  }, [selectedCat, selectedDiff]);

  async function fetchUser() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user);
    } catch {}
  }

  async function fetchQuizzes() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCat !== "all") params.set("category", selectedCat);
      if (selectedDiff !== "all") params.set("difficulty", selectedDiff);
      const res = await fetch(`/api/quiz?${params}`);
      const data = await res.json();
      setQuizzes(data.quizzes || []);
    } catch {
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  }

  function handleStartQuiz(quiz) {
    if (quiz.isPremium && !user) {
      router.push("/auth?mode=register");
      return;
    }
    router.push(`/play?id=${quiz._id}`);
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-white mb-2">📚 题库中心</h1>
          <p className="text-slate-400">选择你感兴趣的主题，开始答题赢金币！</p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCat(cat.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedCat === cat.key
                  ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20"
                  : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <span>{cat.icon}</span> {cat.label}
            </button>
          ))}
        </div>

        {/* Difficulty Filter */}
        <div className="flex gap-2 mb-8">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.key}
              onClick={() => setSelectedDiff(d.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedDiff === d.key
                  ? "bg-brand-600 text-white"
                  : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Quiz Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="w-12 h-12 bg-slate-700 rounded-xl mb-4" />
                <div className="h-4 bg-slate-700 rounded mb-2 w-3/4" />
                <div className="h-3 bg-slate-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-2">暂无题库</h3>
            <p className="text-slate-400">该分类还没有题目，请换一个试试</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {quizzes.map((quiz, i) => (
              <div
                key={quiz._id}
                className="card-hover p-6 flex flex-col animate-scale-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{quiz.emoji || "🧠"}</div>
                  {quiz.isPremium && (
                    <span className="badge-gold">💎 高奖励</span>
                  )}
                </div>

                <h3 className="font-bold text-white text-lg mb-2 leading-tight">{quiz.title}</h3>
                <p className="text-slate-400 text-sm mb-4 flex-1">{quiz.description}</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <DifficultyBadge difficulty={quiz.difficulty} />
                    <span className="text-slate-500">{quiz.questions?.length || 0} 题</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">⏱️ {quiz.timePerQuestion}秒/题</span>
                    <span className="text-gold-400 font-medium">🪙 最高 {quiz.maxReward}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>🎮 {quiz.playCount?.toLocaleString()} 次</span>
                    {quiz.entryFee > 0 && (
                      <span className="text-orange-400">入场 {quiz.entryFee} 🪙</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleStartQuiz(quiz)}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                      quiz.isPremium
                        ? "btn-gold"
                        : "btn-primary"
                    }`}
                  >
                    {quiz.isPremium ? "💎 立即挑战" : "🚀 开始答题"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-white text-2xl">⏳ 加载中...</div></div>}>
      <QuizList />
    </Suspense>
  );
}
