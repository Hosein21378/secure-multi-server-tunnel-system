"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpCircle, RefreshCw, Download, CheckCircle2, AlertTriangle, History, Loader2,
  Package, GitBranch, Sparkles, Terminal, Rocket,
} from "lucide-react";
import { PRODUCT } from "@/lib/constants";
import { compareVersions } from "@/lib/version";
import { faNum, faNum1, faDate, faDateTime, faMb } from "@/lib/format";
import StatusPill from "@/components/StatusPill";

type ReleaseLite = { id: number; version: string; title: string; notes: string[]; sizeMb: number; publishedAt: string };
type JobLite = { id: number; version: string; status: string; progress: number; log: string; startedAt: string; finishedAt: string | null };

export default function UpdatesClient({ current, releases, jobs }: { current: string; releases: ReleaseLite[]; jobs: JobLite[] }) {
  const router = useRouter();
  const [currentVersion, setCurrentVersion] = useState(current);
  const [checking, setChecking] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<JobLite | null>(null);
  const [err, setErr] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const available = releases.filter((r) => compareVersions(r.version, currentVersion) > 0);
  const latest = available[0];
  const running = activeJob?.status === "running";

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [activeJob?.log]);

  const check = async () => {
    setChecking(true);
    setErr("");
    try {
      await fetch("/api/updates/check", { method: "POST" });
      setCheckedAt(new Date().toISOString());
      router.refresh();
    } finally {
      setChecking(false);
    }
  };

  const install = async (version: string) => {
    setErr("");
    try {
      const res = await fetch("/api/updates/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(d.error ?? "خطا در شروع به‌روزرسانی");
        return;
      }
      const jobId: number = d.jobId;
      setActiveJob({ id: jobId, version, status: "running", progress: 0, log: "", startedAt: new Date().toISOString(), finishedAt: null });
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        const r = await fetch(`/api/updates/status?id=${jobId}`);
        const j: JobLite = await r.json();
        setActiveJob(j);
        if (j.status !== "running" && pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          if (j.status === "success") {
            setCurrentVersion(j.version);
            router.refresh();
          }
        }
      }, 700);
    } catch {
      setErr("ارتباط با سرور برقرار نشد");
    }
  };

  const duration = (j: JobLite) => {
    if (!j.finishedAt) return "—";
    const s = Math.max(1, Math.round((new Date(j.finishedAt).getTime() - new Date(j.startedAt).getTime()) / 1000));
    return `${faNum(s)} ثانیه`;
  };

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">به‌روزرسانی <span className="text-grad">بدون ورود به سرور</span></h2>
          <p className="mt-1 text-xs text-slate-400">
            نسخه‌های جدید از مخزن <span className="font-mono text-slate-300 ltr">{PRODUCT.repo}</span> دریافت و با حفظ اتصالات فعال (Zero-Downtime) نصب می‌شوند.
          </p>
        </div>
        <button onClick={check} disabled={checking} className="btn btn-primary">
          {checking ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          {checking ? "در حال بررسی GitHub…" : "بررسی به‌روزرسانی"}
        </button>
      </div>

      {err && (
        <div className="animate-fade-up flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
          <AlertTriangle size={15} /> {err}
        </div>
      )}

      {/* current version + banner */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="glass-panel animate-fade-up rounded-3xl p-6" style={{ animationDelay: "60ms" }}>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Package size={14} className="text-cyan-300" /> نسخهٔ فعلی هسته و پنل
          </div>
          <div className="mt-3 font-mono text-4xl font-black text-white ltr" dir="ltr">
            v<span className="text-grad">{currentVersion}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className="chip font-mono ltr">{PRODUCT.repo}</span>
            {checkedAt && <span>آخرین بررسی: {faDateTime(checkedAt)}</span>}
          </div>
        </section>

        <section className="animate-fade-up rounded-3xl lg:col-span-2" style={{ animationDelay: "120ms" }}>
          {latest ? (
            <div className="relative h-full overflow-hidden rounded-3xl border border-violet-400/30 bg-gradient-to-l from-violet-600/15 via-violet-500/[0.06] to-transparent p-6">
              <div className="pointer-events-none absolute -left-14 -top-14 h-44 w-44 rounded-full bg-violet-500/20 blur-3xl" />
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs font-bold text-violet-200">
                    <Sparkles size={15} /> نسخهٔ جدید در دسترس است
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-black text-white ltr" dir="ltr">v{latest.version}</span>
                    <span className="truncate text-xs text-slate-300">{latest.title}</span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    {faDate(latest.publishedAt)} • حجم دانلود {faMb(latest.sizeMb)} • نصب با مهاجرت زندهٔ اتصالات، بدون حتی یک ثانیه قطعی
                  </p>
                </div>
                <button onClick={() => install(latest.version)} disabled={running} className="btn btn-primary shrink-0">
                  {running ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                  {running ? "در حال نصب…" : "نصب همین الان"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center gap-4 rounded-3xl border border-emerald-400/25 bg-emerald-400/[0.06] p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                <CheckCircle2 size={22} />
              </span>
              <div>
                <div className="text-sm font-bold text-emerald-200">سیستم شما کاملاً به‌روز است</div>
                <p className="mt-1 text-[11px] text-slate-400">آخرین نسخهٔ nova-core نصب شده؛ بررسی خودکار روزانه فعال است و Agent سرورها نیز همزمان به‌روز می‌شوند.</p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* live install console */}
      {activeJob && (
        <section className="glass-deep animate-fade-up overflow-hidden rounded-3xl border-cyan-400/20">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <Terminal size={16} className="text-cyan-300" />
              <h3 className="text-sm font-bold text-white">کنسول نصب — به‌روزرسانی به نسخهٔ <span className="font-mono text-cyan-300 ltr">v{activeJob.version}</span></h3>
            </div>
            <StatusPill status={activeJob.status} />
          </div>
          <div className="px-5 pt-4">
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="relative h-full rounded-full bg-gradient-to-l from-cyan-400 to-violet-500 transition-all duration-700" style={{ width: `${activeJob.progress}%` }}>
                <div className="shimmer-line absolute inset-0 opacity-60" />
              </div>
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-slate-500">
              <span>پیشرفت نصب</span>
              <span className="font-mono ltr">{faNum(activeJob.progress)}٪</span>
            </div>
          </div>
          <div ref={logRef} className="max-h-64 overflow-y-auto px-5 py-4">
            <div className="space-y-1.5 rounded-2xl border border-white/5 bg-[#070b16] p-4 text-[11.5px] leading-6">
              {activeJob.log.split("\n").filter(Boolean).map((line, i) => (
                <div key={i} className="animate-fade-up flex items-baseline gap-2 text-slate-300">
                  <span className="shrink-0 text-cyan-500/70">▸</span>
                  <span>{line}</span>
                </div>
              ))}
              {activeJob.status === "running" && (
                <div className="flex items-center gap-2 text-cyan-300">
                  <span className="shrink-0">▸</span>
                  <span className="animate-blink inline-block h-3.5 w-2 translate-y-0.5 bg-cyan-400/80" />
                </div>
              )}
            </div>
            {activeJob.status === "success" && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-2.5 text-xs text-emerald-200">
                <Rocket size={15} /> به‌روزرسانی با موفقیت نصب شد؛ Agent تمام سرورها نیز خودکار به‌روز شد. نسخهٔ فعلی: <span className="font-mono ltr">v{activeJob.version}</span>
              </div>
            )}
            {activeJob.status === "failed" && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-200">
                <AlertTriangle size={15} /> نصب ناموفق بود؛ نسخهٔ قبلی بدون تغییر حفظ شده است.
              </div>
            )}
          </div>
        </section>
      )}

      {/* releases */}
      <section>
        <h3 className="animate-fade-up mb-4 flex items-center gap-2 text-sm font-bold text-white">
          <GitBranch size={16} className="text-violet-300" /> نسخه‌های منتشرشده
        </h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {releases.map((r, i) => {
            const isNewer = compareVersions(r.version, currentVersion) > 0;
            const isCurrent = r.version === currentVersion;
            return (
              <article key={r.id} className="glass-panel card-hover animate-fade-up relative overflow-hidden rounded-3xl p-5" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-lg font-black text-white ltr" dir="ltr">v{r.version}</span>
                      {i === 0 && <span className="chip border-violet-400/40 bg-violet-400/15 text-violet-200"><Sparkles size={11} /> جدیدترین</span>}
                      {isCurrent && <span className="chip border-emerald-400/35 bg-emerald-400/10 text-emerald-300">نصب‌شده</span>}
                    </div>
                    <div className="mt-1.5 text-xs font-bold text-slate-200">{r.title}</div>
                    <div className="mt-1 text-[10.5px] text-slate-500">{faDate(r.publishedAt)} • {faMb(r.sizeMb)}</div>
                  </div>
                  {isNewer && (
                    <button onClick={() => install(r.version)} disabled={running} className="btn btn-soft shrink-0 !py-1.5 text-xs">
                      <ArrowUpCircle size={14} /> نصب
                    </button>
                  )}
                </div>
                <ul className="mt-4 space-y-1.5 border-t border-white/5 pt-3.5">
                  {r.notes.map((n, j) => (
                    <li key={j} className="flex items-start gap-2 text-[11.5px] leading-5 text-slate-400">
                      <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-cyan-400/80" />
                      {n}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      {/* history */}
      <section className="glass-panel animate-fade-up overflow-hidden rounded-3xl">
        <div className="flex items-center gap-2.5 px-5 py-4 sm:px-6">
          <History size={16} className="text-slate-400" />
          <h3 className="text-sm font-bold text-white">تاریخچهٔ به‌روزرسانی‌ها</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-right text-xs">
            <thead>
              <tr className="border-y border-white/5 bg-white/[0.03] text-[11px] text-slate-500">
                <th className="px-6 py-3 font-medium">نسخه</th>
                <th className="px-4 py-3 font-medium">وضعیت</th>
                <th className="px-4 py-3 font-medium">شروع</th>
                <th className="px-4 py-3 font-medium">مدت زمان</th>
              </tr>
            </thead>
            <tbody>
              {(activeJob && activeJob.id !== jobs[0]?.id ? [activeJob, ...jobs] : jobs.map((j) => (j.id === activeJob?.id ? activeJob : j))).map((j) => (
                <tr key={j.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                  <td className="px-6 py-3.5 font-mono font-bold text-white ltr">v{j.version}</td>
                  <td className="px-4 py-3.5"><StatusPill status={j.status} /></td>
                  <td className="px-4 py-3.5 text-slate-400">{faDateTime(j.startedAt)}</td>
                  <td className="px-4 py-3.5 text-slate-400">{duration(j)}</td>
                </tr>
              ))}
              {jobs.length === 0 && !activeJob && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">هنوز به‌روزرسانی ثبت نشده است.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
