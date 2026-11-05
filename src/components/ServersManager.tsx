"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, RefreshCw, Power, Trash2, X, Check, Loader2, Server, TerminalSquare, MapPin, TriangleAlert,
} from "lucide-react";
import { COUNTRIES, ROLE_FA } from "@/lib/constants";
import { faNum } from "@/lib/format";
import { genWalk } from "@/lib/series";
import StatusPill from "@/components/StatusPill";
import CopyButton from "@/components/CopyButton";
import { Sparkline } from "@/components/charts";

type ServerLite = {
  id: number; name: string; country: string; countryCode: string; city: string; ip: string;
  role: string; status: string; latency: number; load: number; agentVersion: string;
};

const ROLE_COLORS: Record<string, string> = {
  entry: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  relay: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  exit: "border-violet-400/30 bg-violet-400/10 text-violet-300",
};

export default function ServersManager({ servers, installCmd }: { servers: ServerLite[]; installCmd: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [confirmDel, setConfirmDel] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState("");
  const [country, setCountry] = useState(COUNTRIES[1].name);
  const [city, setCity] = useState("");
  const [ip, setIp] = useState("");
  const [role, setRole] = useState<"entry" | "relay" | "exit">("exit");

  const act = async (id: number, path: string, body?: object) => {
    setBusy(id);
    try {
      await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const toggleStatus = async (s: ServerLite) => {
    setBusy(s.id);
    try {
      await fetch(`/api/servers/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: s.status === "online" ? "offline" : "online" }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: number) => {
    setBusy(id);
    try {
      await fetch(`/api/servers/${id}`, { method: "DELETE" });
      setConfirmDel(null);
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setErr("");
    try {
      const res = await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), country, city: city.trim(), ip: ip.trim(), role }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(d.error ?? "خطا در افزودن سرور");
        return;
      }
      setOpen(false);
      setName(""); setCity(""); setIp("");
      router.refresh();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">مدیریت <span className="text-grad">سرورها</span></h2>
          <p className="mt-1 text-xs text-slate-400">
            {faNum(servers.length)} سرور متصل • {faNum(servers.filter((s) => s.status === "online").length)} آنلاین — Agent سبک روی هر سرور نصب می‌شود و همیشه از پنل به‌روز می‌ماند
          </p>
        </div>
        <button onClick={() => setOpen(true)} className="btn btn-primary"><Plus size={16} />افزودن سرور</button>
      </div>

      {/* agent install banner */}
      <div className="glass-panel animate-fade-up flex flex-col gap-4 rounded-3xl p-5 sm:p-6 lg:flex-row lg:items-center" style={{ animationDelay: "80ms" }}>
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300 shadow-[0_0_24px_-6px_rgba(34,211,238,0.5)]">
            <TerminalSquare size={20} />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white">نصب Agent روی سرور جدید — بدون تنظیمات دستی</h3>
            <p className="mt-1 text-[11px] leading-5 text-slate-400">
              این دستور را روی هر سروری (Ubuntu/Debian اوبونتو ۲۲+) اجرا کنید؛ Agent خودش به پنل متصل، کلیدها را ردوبدل و سرویس را ثبت می‌کند.
            </p>
            <div className="mt-3 flex items-center gap-2 overflow-x-auto rounded-2xl border border-white/5 bg-[#070b16] px-4 py-3">
              <code dir="ltr" className="whitespace-nowrap font-mono text-[11px] text-cyan-200/90">{installCmd}</code>
              <CopyButton text={installCmd} small />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {servers.map((s, i) => (
          <article key={s.id} className="glass-panel card-hover animate-fade-up relative overflow-hidden rounded-3xl p-5" style={{ animationDelay: `${120 + i * 60}ms` }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300">
                  <Server size={17} />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-white">{s.name}</h3>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-slate-500">
                    <MapPin size={11} />
                    {s.country}، {s.city}
                    <span className="font-mono text-slate-600 ltr">[{s.countryCode}]</span>
                  </div>
                </div>
              </div>
              <StatusPill status={s.status} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`chip ${ROLE_COLORS[s.role] ?? ROLE_COLORS.exit}`}>{ROLE_FA[s.role] ?? s.role}</span>
              <span className="chip font-mono text-slate-400 ltr">agent v{s.agentVersion}</span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5">
              <code className="font-mono text-xs text-cyan-200 ltr">{s.ip}</code>
              <CopyButton text={s.ip} small />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-sm font-bold text-cyan-300 ltr">{faNum(s.latency)}ms</span>
                  <Sparkline data={genWalk(`srv-${s.id}`, 14, s.latency, 4, Math.max(3, s.latency - 8), s.latency + 16)} color="#22d3ee" width={56} height={20} />
                </div>
                <div className="mt-0.5 text-[10px] text-slate-500">پینگ از پنل</div>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-sm font-bold text-white ltr">{faNum(s.load)}٪</span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${s.load}%`, background: s.load > 70 ? "#fb7185" : s.load > 45 ? "#fbbf24" : "#34d399" }}
                  />
                </div>
                <div className="mt-1 text-[10px] text-slate-500">بار پردازشی</div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button onClick={() => act(s.id, `/api/servers/${s.id}/ping`)} disabled={busy === s.id} className="btn btn-soft flex-1 !py-2 text-xs">
                {busy === s.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                پینگ مجدد
              </button>
              <button onClick={() => toggleStatus(s)} disabled={busy === s.id} className={`btn !px-2.5 !py-2 ${s.status === "online" ? "btn-soft" : "btn-success"}`} title={s.status === "online" ? "آفلاین کردن" : "آنلاین کردن"}>
                <Power size={14} />
              </button>
              {confirmDel === s.id ? (
                <button onClick={() => remove(s.id)} disabled={busy === s.id} className="btn btn-danger !py-2 text-xs">
                  <Check size={14} /> تأیید حذف
                </button>
              ) : (
                <button onClick={() => setConfirmDel(s.id)} className="btn btn-danger !px-2.5 !py-2" title="حذف سرور">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* add modal */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="glass-deep animate-fade-up relative w-full max-w-lg rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <h3 className="text-sm font-bold text-white">افزودن سرور جدید</h3>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"><X size={17} /></button>
            </div>
            <form onSubmit={create} className="space-y-4 px-6 py-5">
              {err && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3.5 py-2 text-xs text-rose-200">
                  <TriangleAlert size={14} /> {err}
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">نام سرور</label>
                <input className="input" placeholder="مثلاً: لبه پاریس" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs text-slate-400">کشور</label>
                  <select className="input" value={country} onChange={(e) => setCountry(e.target.value)}>
                    {COUNTRIES.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-slate-400">شهر</label>
                  <input className="input" placeholder="پاریس" value={city} onChange={(e) => setCity(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs text-slate-400">آی‌پی عمومی</label>
                  <input className="input font-mono ltr" dir="ltr" placeholder="203.0.113.10" value={ip} onChange={(e) => setIp(e.target.value)} required pattern="^\d{1,3}(\.\d{1,3}){3}$" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-slate-400">نقش سرور</label>
                  <select className="input" value={role} onChange={(e) => setRole(e.target.value as "entry" | "relay" | "exit")}>
                    <option value="entry">ورودی (داخل کشور)</option>
                    <option value="relay">میانی</option>
                    <option value="exit">خروجی (خارج)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn btn-soft text-xs">انصراف</button>
                <button type="submit" disabled={creating} className="btn btn-primary text-xs">
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {creating ? "در حال ثبت و اتصال Agent…" : "ثبت سرور"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
