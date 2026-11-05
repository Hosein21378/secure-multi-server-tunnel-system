"use client";

import { useState } from "react";
import { User, Lock, LogIn, AlertTriangle, Loader2, Terminal } from "lucide-react";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "خطا در ورود");
        setLoading(false);
        return;
      }
      window.location.href = "/";
    } catch {
      setError("ارتباط با سرور برقرار نشد");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="w-full space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-200" role="alert">
          <AlertTriangle size={15} className="shrink-0" />
          {error}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs text-slate-400">نام کاربری</label>
        <div className="relative">
          <User size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input !pr-10"
            placeholder="admin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            dir="ltr"
            style={{ textAlign: "left", paddingLeft: "0.95rem" }}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs text-slate-400">رمز عبور</label>
        <div className="relative">
          <Lock size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="password"
            className="input !pr-10"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            dir="ltr"
            style={{ textAlign: "left", paddingLeft: "0.95rem" }}
          />
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary w-full !py-3 text-sm font-bold">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
        {loading ? "در حال احراز هویت…" : "ورود امن به پنل"}
      </button>

      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[11px] text-slate-400">
        <Terminal size={14} className="shrink-0 text-cyan-400" />
        <span>
          ورود دمو: <span className="font-mono text-cyan-300 ltr">admin</span> /{" "}
          <span className="font-mono text-cyan-300 ltr">admin123</span> — پس از ورود از بخش تنظیمات تغییرش دهید.
        </span>
      </div>
    </form>
  );
}
