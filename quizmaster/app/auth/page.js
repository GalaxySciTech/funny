"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function AuthForm() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") || "login";
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body = mode === "register"
        ? { username: form.username, email: form.email, password: form.password }
        : { email: form.email, password: form.password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "操作失败");
        return;
      }

      router.push("/quiz");
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-4xl">🧠</span>
            <span className="font-black text-2xl bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">QuizMaster</span>
          </Link>
          <h1 className="text-3xl font-black text-white">
            {mode === "register" ? "🎉 创建账号" : "👋 欢迎回来"}
          </h1>
          <p className="text-slate-400 mt-2">
            {mode === "register" ? "注册即送200金币！" : "继续你的知识冒险"}
          </p>
        </div>

        <div className="card p-8">
          {/* Mode Switcher */}
          <div className="flex bg-slate-700/50 rounded-xl p-1 mb-6">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "login" ? "bg-brand-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              登录
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "register" ? "bg-brand-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">用户名</label>
                <input
                  type="text"
                  placeholder="3-20位字母或数字"
                  className="input-field"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  minLength={3}
                  maxLength={20}
                />
              </div>
            )}

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">邮箱</label>
              <input
                type="email"
                placeholder="your@email.com"
                className="input-field"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">密码</label>
              <input
                type="password"
                placeholder={mode === "register" ? "至少6位" : "输入密码"}
                className="input-field"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><span className="animate-spin">⏳</span> 处理中...</>
              ) : mode === "register" ? (
                <><span>🚀</span> 立即注册</>
              ) : (
                <><span>🎯</span> 登录</>
              )}
            </button>
          </form>

          {mode === "register" && (
            <div className="mt-6 p-4 bg-gold-500/10 border border-gold-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-gold-400 text-sm font-medium mb-2">
                <span>🎁</span> 新用户福利
              </div>
              <ul className="space-y-1 text-slate-400 text-sm">
                <li>✅ 注册即送 200 金币</li>
                <li>✅ 前3天免费访问所有题库</li>
                <li>✅ 专属新手徽章</li>
              </ul>
            </div>
          )}
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          继续即代表同意我们的
          <span className="text-brand-400 cursor-pointer hover:underline"> 服务条款</span> 和
          <span className="text-brand-400 cursor-pointer hover:underline"> 隐私政策</span>
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-white text-2xl">⏳ 加载中...</div></div>}>
      <AuthForm />
    </Suspense>
  );
}
