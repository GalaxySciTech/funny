import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function HomePage() {
  const features = [
    { icon: "🎯", title: "精准题库", desc: "8大分类，数百道精心设计的题目" },
    { icon: "⏱️", title: "计时挑战", desc: "限时作答，考验你的反应速度" },
    { icon: "🏆", title: "实时排行", desc: "与全球玩家比拼，争夺第一名" },
    { icon: "🪙", title: "赚取金币", desc: "答题正确赚金币，连胜获得额外奖励" },
    { icon: "🔥", title: "每日连胜", desc: "坚持每天答题，连胜奖励翻倍" },
    { icon: "🎖️", title: "徽章系统", desc: "解锁专属成就徽章，展示你的实力" },
  ];

  const categories = [
    { icon: "🔬", name: "科学", key: "science", count: "50+题", color: "from-blue-500 to-cyan-400" },
    { icon: "📜", name: "历史", key: "history", count: "60+题", color: "from-amber-500 to-yellow-400" },
    { icon: "🌏", name: "地理", key: "geography", count: "45+题", color: "from-green-500 to-emerald-400" },
    { icon: "⚽", name: "体育", key: "sports", count: "55+题", color: "from-red-500 to-orange-400" },
    { icon: "💻", name: "科技", key: "technology", count: "40+题", color: "from-purple-500 to-violet-400" },
    { icon: "🎬", name: "娱乐", key: "entertainment", count: "50+题", color: "from-pink-500 to-rose-400" },
    { icon: "🍜", name: "美食", key: "food", count: "35+题", color: "from-orange-500 to-amber-400" },
    { icon: "🦁", name: "动物", key: "animals", count: "40+题", color: "from-teal-500 to-green-400" },
  ];

  const stats = [
    { value: "10,000+", label: "注册玩家" },
    { value: "500+", label: "精选题目" },
    { value: "50,000+", label: "每日对战" },
    { value: "¥100,000+", label: "已发放奖励" },
  ];

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
            每日新题 · 赢取真实奖励
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight animate-slide-up">
            <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              挑战知识极限
            </span>
            <br />
            <span className="text-white">赢取丰厚奖励</span>
          </h1>

          <p className="text-slate-300 text-xl md:text-2xl mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in">
            加入 <span className="text-brand-400 font-bold">10,000+</span> 玩家的知识竞技场，
            答题赚金币，登顶排行榜！
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up">
            <Link href="/quiz" className="btn-primary text-lg py-4 px-8 inline-flex items-center gap-2">
              <span>🚀</span> 立即开始答题
            </Link>
            <Link href="/auth?mode=register" className="btn-secondary text-lg py-4 px-8 inline-flex items-center gap-2">
              <span>🎁</span> 免费注册领200金币
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((stat, i) => (
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
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">探索所有分类</h2>
          <p className="text-slate-400 text-lg">8大主题，找到你最擅长的领域</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((cat, i) => (
            <Link
              key={cat.key}
              href={`/quiz?category=${cat.key}`}
              className="group card-hover p-6 text-center animate-scale-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-lg`}>
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
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">为什么选择我们</h2>
            <p className="text-slate-400 text-lg">专为中文用户打造的知识竞赛平台</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="card p-6 hover:border-brand-500/50 transition-all animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / Monetization */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">金币商店</h2>
          <p className="text-slate-400 text-lg">购买金币，解锁更多高奖励赛事</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { coins: 500, price: "¥6", bonus: "", color: "from-slate-600 to-slate-700", popular: false },
            { coins: 1200, price: "¥12", bonus: "+200 赠送", color: "from-brand-600 to-brand-700", popular: true },
            { coins: 3000, price: "¥25", bonus: "+800 赠送", color: "from-gold-500 to-amber-600", popular: false },
          ].map((pkg, i) => (
            <div key={i} className={`relative card p-8 text-center ${pkg.popular ? "ring-2 ring-brand-500 scale-105" : ""}`}>
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                  最受欢迎
                </div>
              )}
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${pkg.color} flex items-center justify-center text-2xl shadow-lg`}>
                🪙
              </div>
              <div className="text-4xl font-black text-white mb-1">{pkg.coins}</div>
              <div className="text-slate-400 mb-2">金币</div>
              {pkg.bonus && <div className="badge badge-green mb-4">{pkg.bonus}</div>}
              <div className="text-3xl font-black text-brand-400 mb-6">{pkg.price}</div>
              <Link href="/auth?mode=register" className={`block w-full py-3 rounded-xl font-bold transition-all ${pkg.popular ? "btn-primary" : "btn-secondary"}`}>
                立即购买
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-brand-700 to-purple-700 py-20">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-4xl font-black text-white mb-4">准备好了吗？</h2>
          <p className="text-brand-100 text-xl mb-8">
            立即注册，获得 <span className="font-black text-white">200枚免费金币</span>，开始你的知识冒险！
          </p>
          <Link href="/auth?mode=register" className="bg-white text-brand-700 hover:bg-brand-50 font-black text-xl py-4 px-12 rounded-2xl transition-all hover:-translate-y-1 shadow-2xl inline-block">
            免费开始 →
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
          <p className="text-sm">© 2024 QuizMaster Pro. 知识改变命运，答题改变生活。</p>
        </div>
      </footer>
    </div>
  );
}
