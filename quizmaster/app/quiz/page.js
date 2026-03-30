"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/contexts/LanguageContext";

function DifficultyBadge({ difficulty, labels }) {
  const map = {
    easy: { cls: "badge-green" },
    medium: { cls: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 badge" },
    hard: { cls: "bg-red-500/20 text-red-400 border border-red-500/30 badge" },
  };
  const d = map[difficulty] || map.medium;
  return <span className={d.cls}>{labels[difficulty] || difficulty}</span>;
}

function QuizList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedCat, setSelectedCat] = useState(searchParams.get("category") || "all");
  const [selectedDiff, setSelectedDiff] = useState("all");
  const { t } = useLanguage();
  const q = t.quiz;

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
          <h1 className="text-4xl font-black text-white mb-2">{q.title}</h1>
          <p className="text-slate-400">{q.subtitle}</p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {q.allCategories.map((cat) => (
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
          {q.difficulties.map((d) => (
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
            <h3 className="text-2xl font-bold text-white mb-2">{q.noQuiz}</h3>
            <p className="text-slate-400">{q.noQuizDesc}</p>
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
                    <span className="badge-gold">{q.premiumBadge}</span>
                  )}
                </div>

                <h3 className="font-bold text-white text-lg mb-2 leading-tight">{quiz.title}</h3>
                <p className="text-slate-400 text-sm mb-4 flex-1">{quiz.description}</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <DifficultyBadge difficulty={quiz.difficulty} labels={q.difficultyLabels} />
                    <span className="text-slate-500">{quiz.questions?.length || 0} {q.questions}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">⏱️ {quiz.timePerQuestion}{q.secPerQ}</span>
                    <span className="text-gold-400 font-medium">🪙 {q.maxReward} {quiz.maxReward}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>🎮 {quiz.playCount?.toLocaleString()} {q.plays}</span>
                    {quiz.entryFee > 0 && (
                      <span className="text-orange-400">{q.entryFee} {quiz.entryFee} 🪙</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleStartQuiz(quiz)}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                      quiz.isPremium ? "btn-gold" : "btn-primary"
                    }`}
                  >
                    {quiz.isPremium ? q.premiumBtn : q.startBtn}
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
  const { t } = useLanguage();
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-white text-2xl">{t.quiz.loading}</div></div>}>
      <QuizList />
    </Suspense>
  );
}
