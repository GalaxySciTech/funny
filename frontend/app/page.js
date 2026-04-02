"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/contexts/LanguageContext";

const CATEGORY_COLORS = {
  science: "from-blue-500 to-cyan-400",
  history: "from-amber-500 to-yellow-400",
  geography: "from-green-500 to-emerald-400",
  sports: "from-red-500 to-orange-400",
  technology: "from-purple-500 to-violet-400",
  entertainment: "from-pink-500 to-rose-400",
  food: "from-orange-500 to-amber-400",
  animals: "from-teal-500 to-green-400",
};

export default function HomePage() {
  const { t } = useLanguage();
  const h = t.home;
  const pr = t.pricing;

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {["🧠", "⭐", "🏆", "🎯", "💡", "🚀", "💎", "🎮"].map((emoji, i) => (
            <div
              key={i}
              className="absolute text-2xl opacity-10 animate-bounce-slow"
              style={{
                left: `${10 + i * 12}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${2 + i * 0.5}s`,
              }}
            >
              {emoji}
            </div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 py-20 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-2 text-brand-300 text-sm font-medium mb-6 animate-fade-in">
            <span className="w-2 h-2 bg-brand-400 rounded-full animate-pulse" />
            {h.badge}
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight animate-slide-up">
            <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {h.heroTitle1}
            </span>
            <br />
            <span className="text-white">{h.heroTitle2}</span>
          </h1>

          <p className="text-slate-300 text-xl md:text-2xl mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in">
            {h.heroDesc.split("{count}")[0]}
            <span className="text-brand-400 font-bold">10,000+</span>
            {h.heroDesc.split("{count}")[1]}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up">
            <Link href="/quiz" className="btn-primary text-lg py-4 px-8 inline-flex items-center gap-2">
              {h.startBtn}
            </Link>
            <Link href="/auth?mode=register" className="btn-secondary text-lg py-4 px-8 inline-flex items-center gap-2">
              {h.registerBtn}
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {h.stats.map((stat, i) => (
              <div key={i} className="card p-4 text-center animate-scale-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="text-3xl font-black text-brand-400">{stat.value}</div>
                <div className="text-slate-400 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">{h.categoriesTitle}</h2>
          <p className="text-slate-400 text-lg">{h.categoriesDesc}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {h.categories.map((cat, i) => (
            <Link
              key={cat.key}
              href={`/quiz?category=${cat.key}`}
              className="group card-hover p-6 text-center animate-scale-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${CATEGORY_COLORS[cat.key]} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-lg`}>
                {cat.icon}
              </div>
              <div className="font-bold text-white">{cat.name}</div>
              <div className="text-slate-400 text-sm mt-1">{cat.count}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-800/30 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">{h.featuresTitle}</h2>
            <p className="text-slate-400 text-lg">{h.featuresDesc}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {h.features.map((f, i) => (
              <div key={i} className="card p-6 hover:border-brand-500/50 transition-all animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">{h.pricingTitle}</h2>
          <p className="text-slate-400 text-lg">{h.pricingDesc}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Free */}
          <div className="card p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center text-2xl">
              🆓
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{pr.freeTitle}</h3>
            <div className="text-3xl font-black text-slate-300 mb-4">{pr.freePrice}</div>
            <ul className="space-y-2 mb-6 text-sm text-slate-400">
              {pr.features.free.map((f, i) => (
                <li key={i}>○ {f}</li>
              ))}
            </ul>
            <Link href="/auth?mode=register" className="btn-secondary w-full block text-center">
              {h.ctaBtn}
            </Link>
          </div>

          {/* Monthly */}
          <div className="card p-8 text-center ring-2 ring-brand-500 scale-105 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-4 py-1 rounded-full">
              {pr.mostPopular}
            </div>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-500/20 flex items-center justify-center text-2xl">
              💎
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{pr.monthly}</h3>
            <div className="text-3xl font-black text-brand-400 mb-1">{pr.monthlyPrice}<span className="text-sm text-slate-500">{pr.monthlyPriceUnit}</span></div>
            <p className="text-sm text-brand-400/80 mb-4">🪙 2x金币加成 + 500金币</p>
            <Link href="/pricing" className="btn-primary w-full block text-center">
              {pr.subscribe}
            </Link>
          </div>

          {/* Yearly */}
          <div className="card p-8 text-center border-gold-500/30 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gold-500 to-amber-500 text-slate-900 text-xs font-black px-4 py-1 rounded-full">
              {pr.bestValue}
            </div>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold-500/20 flex items-center justify-center text-2xl">
              👑
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{pr.yearly}</h3>
            <div className="text-3xl font-black text-gold-400 mb-1">{pr.yearlyPrice}<span className="text-sm text-slate-500">{pr.yearlyPriceUnit}</span></div>
            <p className="text-sm text-gold-400/80 mb-4">🪙 3x金币加成 + 8000金币 + {pr.yearlySaving}</p>
            <Link href="/pricing" className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-gold-500 to-amber-500 text-slate-900 hover:from-gold-400 hover:to-amber-400 transition-all block text-center">
              {pr.subscribe}
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-brand-700 to-purple-700 py-20">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-4xl font-black text-white mb-4">{h.ctaTitle}</h2>
          <p className="text-brand-100 text-xl mb-8">
            {h.ctaDesc.split("{coins}")[0]}
            <span className="font-black text-white">{h.ctaFreeCoins}</span>
            {h.ctaDesc.split("{coins}")[1]}
          </p>
          <Link href="/auth?mode=register" className="bg-white text-brand-700 hover:bg-brand-50 font-black text-xl py-4 px-12 rounded-2xl transition-all hover:-translate-y-1 shadow-2xl inline-block">
            {h.ctaBtn}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl">🧠</span>
            <span className="font-black text-slate-400">QuizMaster Pro</span>
          </div>
          <p className="text-sm">© 2024 QuizMaster Pro. {h.footerTagline}</p>
        </div>
      </footer>
    </div>
  );
}
