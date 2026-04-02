"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiFetch } from "@/lib/api";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { lang, toggleLang, t } = useLanguage();

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  async function fetchUser() {
    try {
      const res = await apiFetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }

  async function handleLogout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }

  const navLinks = [
    { href: "/", label: t.nav.home, icon: "🏠" },
    { href: "/quiz", label: t.nav.quiz, icon: "📚" },
    { href: "/leaderboard", label: t.nav.leaderboard, icon: "🏆" },
    { href: "/pricing", label: t.nav.pricing, icon: "💎" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50 shadow-xl">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl group-hover:scale-110 transition-transform">🧠</span>
            <span className="font-black text-xl bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
              QuizMaster
            </span>
            <span className="badge badge-gold hidden sm:flex">Pro</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === link.href
                    ? "bg-brand-600/30 text-brand-300 border border-brand-600/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLang}
              title={lang === "zh" ? "Switch to English" : "切换中文"}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-600/70 border border-slate-600/50 text-slate-300 hover:text-white text-xs font-bold transition-all"
            >
              {lang === "zh" ? "EN" : "中"}
            </button>

            {user ? (
              <>
                {/* Daily play counter for free users */}
                {!user.isPremium && (
                  <div className="hidden sm:flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-1.5">
                    <span className="text-orange-400 text-xs font-bold">
                      🎮 {user.dailyPlaysRemaining ?? "?"}/{user.dailyPlayLimit ?? 3}
                    </span>
                  </div>
                )}

                {/* Daily reward indicator */}
                {user.canClaimDaily && (
                  <Link
                    href="/profile?tab=subscription"
                    className="hidden sm:flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-2.5 py-1.5 hover:bg-emerald-500/20 transition-all animate-pulse"
                  >
                    <span className="text-sm">🎁</span>
                    <span className="text-emerald-400 text-xs font-bold">{t.nav.dailyReward}</span>
                  </Link>
                )}

                <Link href="/profile" className="hidden sm:flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-xl px-3 py-1.5 hover:bg-gold-500/20 transition-all">
                  <span className="text-gold-400">🪙</span>
                  <span className="text-gold-400 font-bold text-sm">{user.coins?.toLocaleString()}</span>
                </Link>

                <Link
                  href="/profile"
                  className="hidden sm:flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    user.isPremium
                      ? "bg-gradient-to-br from-gold-400 to-amber-500 ring-2 ring-gold-400/50"
                      : "bg-gradient-to-br from-brand-400 to-purple-500"
                  }`}>
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-slate-300 font-medium">{user.username}</span>
                    {user.isPremium && (
                      <span className="text-xs bg-gradient-to-r from-gold-400 to-amber-500 text-slate-900 font-black px-1.5 py-0.5 rounded-md">
                        PRO
                      </span>
                    )}
                  </div>
                </Link>

                {/* Upgrade CTA for free users */}
                {!user.isPremium && (
                  <Link
                    href="/pricing"
                    className="hidden sm:flex items-center gap-1 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-brand-500/20"
                  >
                    💎 {t.nav.upgrade}
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="hidden sm:block text-slate-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-slate-700/50 transition-all"
                >
                  {t.nav.logout}
                </button>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/auth?mode=login" className="btn-secondary py-2 px-4 text-sm">
                  {t.nav.login}
                </Link>
                <Link href="/auth?mode=register" className="btn-primary py-2 px-4 text-sm">
                  {t.nav.register}
                </Link>
              </div>
            )}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <div className="space-y-1.5">
                <span className={`block w-5 h-0.5 bg-white transition-transform ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
                <span className={`block w-5 h-0.5 bg-white transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
                <span className={`block w-5 h-0.5 bg-white transition-transform ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
              </div>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-slate-700/50 mt-2 pt-4 space-y-2 animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  pathname === link.href
                    ? "bg-brand-600/30 text-brand-300"
                    : "text-slate-300 hover:bg-slate-700/50"
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50">
                  <span>👤</span> {user.username} · 🪙{user.coins}
                  {user.isPremium && <span className="text-xs bg-gold-500 text-slate-900 font-bold px-1.5 py-0.5 rounded-md ml-1">PRO</span>}
                </Link>
                {!user.isPremium && (
                  <Link href="/pricing" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm bg-brand-600/20 text-brand-300">
                    💎 {t.nav.upgrade}
                  </Link>
                )}
                <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-700/50">
                  {t.nav.logoutMobile}
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link href="/auth?mode=login" onClick={() => setMenuOpen(false)} className="flex-1 btn-secondary py-2 text-sm text-center">{t.nav.login}</Link>
                <Link href="/auth?mode=register" onClick={() => setMenuOpen(false)} className="flex-1 btn-primary py-2 text-sm text-center">{t.nav.register}</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
