"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiFetch } from "@/lib/api";

function Confetti() {
  const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"];
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 2}s`,
    duration: `${2 + Math.random() * 3}s`,
    size: `${8 + Math.random() * 12}px`,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-particle rounded-sm"
          style={{
            left: p.left,
            top: "-20px",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

function TimerRing({ timeLeft, total }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / total;
  const offset = circumference * (1 - progress);
  const color = progress > 0.5 ? "#0ea5e9" : progress > 0.25 ? "#f59e0b" : "#ef4444";

  return (
    <svg width="100" height="100" className="transform -rotate-90">
      <circle cx="50" cy="50" r={radius} fill="none" stroke="#1e293b" strokeWidth="8" />
      <circle
        cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" className="timer-ring transition-all duration-1000"
      />
      <text
        x="50" y="50" textAnchor="middle" dominantBaseline="middle"
        className="transform rotate-90"
        style={{ fill: color, fontSize: "20px", fontWeight: "bold", transform: "rotate(90deg)", transformOrigin: "50px 50px" }}
      >
        {timeLeft}
      </text>
    </svg>
  );
}

function PlayGame() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const quizId = searchParams.get("id");
  const { t } = useLanguage();
  const pl = t.play;

  const [phase, setPhase] = useState("loading");
  const [quiz, setQuiz] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [startTime, setStartTime] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [result, setResult] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!quizId) {
      setError(pl.invalidId);
      return;
    }
    loadQuiz();
  }, [quizId]);

  async function loadQuiz() {
    try {
      const res = await apiFetch(`/api/quiz/play?id=${quizId}`);
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "daily_limit_reached") {
          setError(data.message || pl.noPlaysLeft);
          return;
        }
        setError(data.error || pl.loadFailed);
        return;
      }
      setQuiz(data.quiz);
      setAnswers(new Array(data.quiz.questions.length).fill(-1));
      setTimeLeft(data.quiz.timePerQuestion);
      setPhase("countdown");
    } catch {
      setError(pl.networkError);
    }
  }

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("playing");
      setStartTime(Date.now());
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      handleNextQuestion(true);
      return;
    }
    const t = setInterval(() => setTimeLeft((tl) => tl - 1), 1000);
    return () => clearInterval(t);
  }, [phase, timeLeft, currentQ]);

  const handleAnswer = useCallback((optionIndex) => {
    if (selected !== null) return;
    setSelected(optionIndex);
    const newAnswers = [...answers];
    newAnswers[currentQ] = optionIndex;
    setAnswers(newAnswers);
    const q = quiz.questions[currentQ];
    if (optionIndex === q.correctIndex) {
      setScore((s) => s + q.points);
    }
    setShowExplanation(true);
    setTimeout(() => handleNextQuestion(false), 1800);
  }, [selected, answers, currentQ, quiz]);

  function handleNextQuestion(timeout) {
    if (!timeout && selected === null) return;
    setShowExplanation(false);
    setSelected(null);

    if (currentQ + 1 >= quiz.questions.length) {
      submitQuiz();
    } else {
      setCurrentQ((q) => q + 1);
      setTimeLeft(quiz.timePerQuestion);
    }
  }

  async function submitQuiz() {
    setPhase("result");
    const timeTaken = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
    try {
      const res = await apiFetch("/api/quiz/submit", {
        method: "POST",
        body: JSON.stringify({ quizId, answers, timeTaken }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ score, correctCount: 0, totalQuestions: quiz.questions.length, accuracy: 0, coinsEarned: 0 });
    }
  }

  if (error) {
    const isLimitError = error.includes("免费次数") || error.includes("plays left");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card p-10 text-center max-w-md">
          <div className="text-5xl mb-4">{isLimitError ? "😱" : "😕"}</div>
          <h2 className="text-2xl font-bold text-white mb-2">{isLimitError ? pl.noPlaysLeft : pl.loadFailed}</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Link href="/quiz" className="btn-secondary">{pl.backToQuiz}</Link>
            {isLimitError && (
              <Link href="/pricing" className="btn-primary">{pl.upgradeForMore}</Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce-slow">🧠</div>
          <p className="text-white text-xl font-bold">{pl.loading}</p>
          <div className="mt-4 flex gap-2 justify-center">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "countdown") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-scale-in">
          <div className="text-6xl mb-4">{quiz?.emoji || "🧠"}</div>
          <h2 className="text-3xl font-black text-white mb-2">{quiz?.title}</h2>
          <p className="text-slate-400 mb-10">{quiz?.questions?.length} {pl.questionsCount} · {quiz?.timePerQuestion}{pl.secPerQ}</p>
          <div className="text-9xl font-black text-brand-400 animate-pulse-fast">
            {countdown === 0 ? pl.go : countdown}
          </div>
          <p className="text-slate-400 mt-6">{pl.getReady}</p>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    const accuracy = result?.accuracy ?? 0;
    const isGreat = accuracy >= 80;
    const isGood = accuracy >= 60;
    const hasMultiplier = result?.coinMultiplier > 1;

    return (
      <>
        {isGreat && <Confetti />}
        <div className="min-h-screen flex items-center justify-center px-4 py-10">
          <div className="card p-8 max-w-2xl w-full animate-scale-in">
            <div className="text-center mb-8">
              <div className="text-7xl mb-4">
                {isGreat ? "🏆" : isGood ? "🎯" : "💪"}
              </div>
              <h2 className="text-4xl font-black text-white mb-2">
                {isGreat ? pl.great : isGood ? pl.good : pl.keepGoing}
              </h2>
              <p className="text-slate-400 text-lg">{pl.accuracy}{accuracy}%</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-brand-400">{result?.score ?? score}</div>
                <div className="text-slate-400 text-sm mt-1">{pl.totalScore}</div>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-emerald-400">
                  {result?.correctCount ?? 0}/{result?.totalQuestions ?? quiz?.questions?.length}
                </div>
                <div className="text-slate-400 text-sm mt-1">{pl.correct}</div>
              </div>
              <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-gold-400">+{result?.coinsEarned ?? 0}</div>
                <div className="text-slate-400 text-sm mt-1">{pl.coinsEarned}</div>
              </div>
            </div>

            {/* Bonus breakdown */}
            {(hasMultiplier || result?.streakBonus > 0 || result?.perfectBonus > 0) && (
              <div className="bg-slate-700/30 rounded-xl p-4 mb-6 space-y-2">
                {hasMultiplier && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-brand-400 font-medium">
                      💎 {pl.proMultiplier.replace("{n}", result.coinMultiplier)}
                    </span>
                    <span className="text-gold-400 font-bold">+{result.premiumBonus} 🪙</span>
                  </div>
                )}
                {result?.streakBonus > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-orange-400 font-medium">🔥 {pl.streakBonus}</span>
                    <span className="text-gold-400 font-bold">+{result.streakBonus} 🪙</span>
                  </div>
                )}
                {result?.perfectBonus > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-emerald-400 font-medium">💯 {pl.perfectBonus}</span>
                    <span className="text-gold-400 font-bold">+{result.perfectBonus} 🪙</span>
                  </div>
                )}
              </div>
            )}

            {/* Daily plays remaining */}
            {result?.dailyPlaysRemaining !== null && result?.dailyPlaysRemaining !== undefined && (
              <div className={`rounded-xl p-3 mb-6 text-center text-sm font-medium ${
                result.dailyPlaysRemaining > 0
                  ? "bg-slate-700/30 text-slate-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              }`}>
                {result.dailyPlaysRemaining > 0
                  ? pl.dailyPlaysLeft.replace("{n}", result.dailyPlaysRemaining)
                  : (
                    <div className="flex items-center justify-center gap-2">
                      <span>{pl.noPlaysLeft}</span>
                      <Link href="/pricing" className="text-brand-400 hover:text-brand-300 underline">
                        {pl.upgradeForMore}
                      </Link>
                    </div>
                  )
                }
              </div>
            )}

            {/* Upgrade CTA for free users */}
            {!hasMultiplier && result?.coinsEarned > 0 && (
              <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 mb-6 text-center">
                <p className="text-brand-400 text-sm font-medium">
                  💎 升级Pro后这局可以赚到 <span className="font-black text-lg">{result.coinsEarned * 2}~{result.coinsEarned * 3}</span> 金币！
                </p>
                <Link href="/pricing" className="inline-block mt-2 text-xs text-brand-400 hover:text-brand-300 underline">
                  {pl.upgradeForMore}
                </Link>
              </div>
            )}

            {/* Answer Review */}
            {result?.results && (
              <div className="space-y-3 mb-8">
                <h3 className="text-white font-bold text-lg">{pl.reviewTitle}</h3>
                {result.results.map((r, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border ${
                      r.isCorrect
                        ? "bg-emerald-500/10 border-emerald-500/20"
                        : "bg-red-500/10 border-red-500/20"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span>{r.isCorrect ? "✅" : "❌"}</span>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{quiz?.questions?.[i]?.question}</p>
                        {!r.isCorrect && (
                          <p className="text-slate-400 text-sm mt-1">
                            {pl.correctAnswer}{quiz?.questions?.[i]?.options?.[r.correctIndex]}
                          </p>
                        )}
                        {r.explanation && (
                          <p className="text-slate-500 text-xs mt-1">💡 {r.explanation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPhase("countdown");
                  setCurrentQ(0);
                  setAnswers(new Array(quiz.questions.length).fill(-1));
                  setSelected(null);
                  setScore(0);
                  setCountdown(3);
                  setResult(null);
                  setTimeLeft(quiz.timePerQuestion);
                }}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
              >
                {pl.playAgain}
              </button>
              <Link href="/quiz" className="flex-1 btn-primary flex items-center justify-center gap-2">
                {pl.nextQuiz}
              </Link>
              <Link href="/leaderboard" className="flex-1 btn-secondary flex items-center justify-center gap-2">
                {pl.viewLeaderboard}
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Playing phase
  const question = quiz?.questions?.[currentQ];
  if (!question) return null;

  const progress = ((currentQ) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-3xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-3">
          <Link href="/quiz" className="text-slate-400 hover:text-white text-sm flex items-center gap-1">
            {pl.exit}
          </Link>
          <span className="text-slate-400 text-sm">
            {currentQ + 1} / {quiz.questions.length}
          </span>
          <div className="flex items-center gap-1 text-gold-400 font-bold text-sm">
            🪙 {score} {pl.scoreLabel}
          </div>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="card p-8 mb-6 animate-fade-in">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="badge badge-blue">Q{currentQ + 1}</span>
                <span className="text-slate-400 text-sm">+{question.points} {pl.scoreLabel}</span>
              </div>
              <p className="text-white text-xl font-bold leading-relaxed">{question.question}</p>
            </div>
            <div className="shrink-0">
              <TimerRing timeLeft={timeLeft} total={quiz.timePerQuestion} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {question.options.map((option, i) => {
            const isSelected = selected === i;
            const isCorrect = selected !== null && i === question.correctIndex;
            const isWrong = isSelected && i !== question.correctIndex;

            let optionClass = "card p-4 cursor-pointer question-option flex items-center gap-3 ";
            if (selected === null) {
              optionClass += "hover:border-brand-500/50 hover:bg-slate-700/60";
            } else if (isCorrect) {
              optionClass += "bg-emerald-500/20 border-emerald-500/50 text-emerald-300";
            } else if (isWrong) {
              optionClass += "bg-red-500/20 border-red-500/50 text-red-300";
            } else {
              optionClass += "opacity-40";
            }

            const optionLabels = ["A", "B", "C", "D"];

            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={selected !== null}
                className={optionClass}
              >
                <span className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold ${
                  isCorrect ? "bg-emerald-500 text-white" :
                  isWrong ? "bg-red-500 text-white" :
                  "bg-slate-700 text-slate-300"
                }`}>
                  {isCorrect ? "✓" : isWrong ? "✗" : optionLabels[i]}
                </span>
                <span className="text-left font-medium">{option}</span>
              </button>
            );
          })}
        </div>

        {showExplanation && question.explanation && (
          <div className="card p-4 border-brand-500/20 bg-brand-500/5 animate-slide-up">
            <div className="flex items-start gap-2">
              <span className="text-brand-400">💡</span>
              <p className="text-slate-300 text-sm">{question.explanation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PlayPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-white text-2xl">{t.play.loadingFallback}</div></div>}>
      <PlayGame />
    </Suspense>
  );
}
