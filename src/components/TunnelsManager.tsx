"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus, Play, Pause, RotateCcw, Trash2, X, ChevronRight, ChevronLeft, Check,
  Waypoints, Shield, Loader2, Network, TriangleAlert,
} from "lucide-react";
import { PROTOCOLS, protocolById } from "@/lib/constants";
import { faNum, faGb } from "@/lib/format";
import { genWalk } from "@/lib/series";
import StatusPill from "@/components/StatusPill";
import { Sparkline } from "@/components/charts";

export type ServerLite = {
  id: number; name: string; city: string; country: string; ip: string; role: string; status: string; latency: number;
};
export type TunnelLite = {
  id: number; name: string; protocol: string; port: number; encryption: string; mtu: number;
  status: string; latency: number; throughput: number; trafficGb: number;
  entry: ServerLite | null; exit: ServerLite | null;
};

const STEPS = ["مشخصات و پروتکل", "انتخاب سرورها", "امنیت و تأیید"];
const ENC_OPTIONS: Record<string, string[]> = {
  hysteria2: ["TLS 1.3 / AES-256-GCM", "TLS 1.3 / ChaCha20-Poly1305"],
  wireguard: ["ChaCha20-Poly1305"],
  vless: ["Reality / X25519", "Reality / X25519 + ML-KEM"],
  gre: ["AES-256 / SHA-384", "AES-256-GCM"],
};

export default function TunnelsManager({ tunnels, servers }: { tunnels: TunnelLite[]; servers: ServerLite[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState<number | null>(null);
  const [confirmDel, setConfirmDel] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");

  const [name, setName] = useState("");
  const [protocol, setProtocol] = useState("hysteria2");
  const [entryId, setEntryId] = useState<number | "">("");
  const [exitId, setExitId] = useState<number | "">("");
  const [port, setPort] = useState(443);
  const [enc, setEnc] = useState("TLS 1.3 / AES-256-GCM");
  const [mtu, setMtu] = useState(1420);

  const entries = servers.filter((s) => s.role === "entry");
  const exits = servers.filter((s) => s.role !== "entry");
  const meta = protocolById(protocol);

  const openWizard = () => {
    setName("");
    setProtocol("hysteria2");
    setEntryId(entries[0]?.id ?? "");
    setExitId(exits[0]?.id ?? "");
    setPort(443);
    setEnc("TLS 1.3 / AES-256-GCM");
    setMtu(1420);
    setStep(0);
    setErr("");
    setOpen(true);
  };

  const pickProtocol = (id: string) => {
    const m = protocolById(id);
    setProtocol(id);
    setPort(m.port);
    setEnc(m.enc);
  };

  const canNext =
    step === 0 ? name.trim().length >= 2
    : step === 1 ? entryId !== "" && exitId !== "" && entryId !== exitId
    : port >= 1 && port <= 65535;

  const act = async (id: number, action: string) => {
    setBusy(id);
    try {
      await fetch(`/api/tunnels/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: number) => {
    setBusy(id);
    try {
      await fetch(`/api/tunnels/${id}`, { method: "DELETE" });
      setConfirmDel(null);
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const create = async () => {
    setCreating(true);
    setErr("");
    try {
      const res = await fetch("/api/tunnels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), protocol, entryServerId: entryId, exitServerId: exitId, port, encryption: enc, mtu }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d.error ?? "خطا در ایجاد تانل");
        return;
      }
      setOpen(false);
      router.refresh();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">مدیریت <span className="text-grad">تانل‌ها</span></h2>
          <p className="mt-1 text-xs text-slate-400">
            {faNum(tunnels.length)} تانل ثبت‌شده • {faNum(tunnels.filter((t) => t.status === "active").length)} فعال — ارتباط امن چند‌سروره با کمترین تأخر
          </p>
        </div>
        <button onClick={openWizard} className="btn btn-primary"><Plus size={16} />ایجاد تانل جدید</button>
      </div>

      {tunnels.length === 0 && (
        <div className="glass-panel animate-fade-up flex flex-col items-center gap-3 rounded-3xl py-16 text-center">
          <Waypoints size={34} className="text-slate-600" />
          <p className="text-sm text-slate-400">هنوز تانلی ساخته نشده است</p>
          <button onClick={openWizard} className="btn btn-primary">ساخت اولین تانل</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {tunnels.map((t, i) => {
          const p = protocolById(t.protocol);
          const active = t.status === "active";
          return (
            <article key={t.id} className="glass-panel card-hover animate-fade-up relative overflow-hidden rounded-3xl p-5" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full blur-3xl" style={{ background: `${p.color}14` }} />

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-bold text-white">{t.name}</h3>
                    <StatusPill status={t.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="chip" style={{ borderColor: `${p.color}44`, background: `${p.color}14`, color: p.color }}>{p.name}</span>
                    <span className="chip text-slate-400"><Shield size={11} className="text-emerald-400" />{t.encryption}</span>
                    <span className="chip font-mono text-slate-400 ltr">:{t.port}</span>
                  </div>
                </div>
                <Sparkline data={genWalk(`tl-${t.id}`, 18, t.latency, 4, Math.max(4, t.latency - 10), t.latency + 18)} color={p.color} width={96} height={32} />
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-xs text-slate-300">
                <Network size={14} className="shrink-0 text-cyan-300" />
                <span className="truncate">
                  <b className="text-slate-100">{t.entry?.name ?? "—"}</b>
                  <span className="mx-1.5 text-slate-600">⇄</span>
                  <b className="text-slate-100">{t.exit?.name ?? "—"}</b>
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  { l: "پینگ", v: `${faNum(t.latency)}ms`, mono: true, c: "text-cyan-300" },
                  { l: "گذردهی", v: active ? `${faNum(t.throughput)}` : "—", s: active ? "Mbps" : "", mono: true, c: "text-white" },
                  { l: "ترافیک", v: faGb(t.trafficGb), mono: false, c: "text-violet-300" },
                ].map((x, j) => (
                  <div key={j} className="rounded-xl border border-white/5 bg-white/[0.02] px-2 py-2.5">
                    <div className={`text-sm font-bold ${x.c} ${x.mono ? "font-mono ltr" : ""}`}>
                      {x.v}{x.s ? <span className="mr-1 text-[9px] font-normal text-slate-500">{x.s}</span> : null}
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-500">{x.l}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Link href={`/tunnels/${t.id}`} className="btn btn-soft flex-1 !py-2 text-xs">مدیریت و مانیتورینگ</Link>
                <button
                  onClick={() => act(t.id, active ? "stop" : "start")}
                  disabled={busy === t.id}
                  className={`btn !py-2 text-xs ${active ? "btn-soft" : "btn-success"}`}
                  title={active ? "توقف تانل" : "شروع تانل"}
                >
                  {busy === t.id ? <Loader2 size={14} className="animate-spin" /> : active ? <Pause size={14} /> : <Play size={14} />}
                  {active ? "توقف" : "شروع"}
                </button>
                <button onClick={() => act(t.id, "restart")} disabled={busy === t.id} className="btn btn-soft !px-2.5 !py-2" title="راه‌اندازی مجدد">
                  <RotateCcw size={14} />
                </button>
                {confirmDel === t.id ? (
                  <button onClick={() => remove(t.id)} disabled={busy === t.id} className="btn btn-danger !py-2 text-xs">
                    <Check size={14} /> تأیید حذف
                  </button>
                ) : (
                  <button onClick={() => setConfirmDel(t.id)} className="btn btn-danger !px-2.5 !py-2" title="حذف تانل">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* wizard modal */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="glass-deep animate-fade-up relative w-full max-w-2xl overflow-hidden rounded-3xl shadow-2xl">
            <div className="pointer-events-none absolute -top-32 right-1/4 h-56 w-72 rounded-full bg-cyan-500/15 blur-3xl" />

            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <h3 className="text-sm font-bold text-white">ویزارد ایجاد تانل امن</h3>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"><X size={17} /></button>
            </div>

            {/* steps indicator */}
            <div className="flex items-center gap-0 px-6 pt-5" dir="ltr">
              {STEPS.map((s, i) => (
                <div key={s} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-all ${
                      i < step ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-300"
                      : i === step ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.45)]"
                      : "border-white/10 bg-white/5 text-slate-500"
                    }`}>
                      {i < step ? <Check size={14} /> : faNum(i + 1)}
                    </span>
                    <span className={`whitespace-nowrap text-[10px] ${i === step ? "text-slate-200" : "text-slate-500"}`}>{s}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={`mx-2 mb-5 h-px flex-1 ${i < step ? "bg-emerald-400/50" : "bg-white/10"}`} />}
                </div>
              ))}
            </div>

            <div className="max-h-[52vh] overflow-y-auto px-6 py-5">
              {step === 0 && (
                <div className="animate-fade-up space-y-5" key="s0">
                  <div>
                    <label className="mb-1.5 block text-xs text-slate-400">نام تانل</label>
                    <input className="input" placeholder="مثلاً: تانل اصلی — تهران ⇄ فرانکفورت" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs text-slate-400">پروتکل تانل</label>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {PROTOCOLS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => pickProtocol(p.id)}
                          className={`rounded-2xl border p-3.5 text-right transition-all ${
                            protocol === p.id ? "border-white/25 bg-white/[0.07] shadow-[0_0_24px_-8px_rgba(34,211,238,0.4)]" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-xs font-bold text-white">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color, boxShadow: `0 0 10px ${p.color}` }} />
                              {p.name}
                            </span>
                            <span className="chip font-mono text-[10px] text-slate-400">{p.latencyLabel}</span>
                          </div>
                          <p className="mt-1.5 text-[10.5px] leading-5 text-slate-400">{p.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="animate-fade-up space-y-5" key="s1">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs text-slate-400">سرور ورودی (داخل کشور)</label>
                      <select className="input" value={entryId} onChange={(e) => setEntryId(Number(e.target.value))}>
                        <option value="">انتخاب کنید…</option>
                        {entries.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} — {s.city} ({s.ip})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs text-slate-400">سرور خروجی (خارج)</label>
                      <select className="input" value={exitId} onChange={(e) => setExitId(Number(e.target.value))}>
                        <option value="">انتخاب کنید…</option>
                        {exits.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} — {s.city} ({s.ip})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {entries.length === 0 || exits.length === 0 ? (
                    <div className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3.5 py-2.5 text-xs text-amber-200">
                      <TriangleAlert size={15} /> برای ساخت تانل به حداقل یک سرور ورودی و یک سرور خروجی نیاز است — از بخش «سرورها» اضافه کنید.
                    </div>
                  ) : (
                    <p className="rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-2.5 text-[11px] leading-5 text-slate-400">
                      مسیر تانل: ترافیک کاربران به سرور ورودی داخل کشور می‌رسد، رمزنگاری می‌شود و از طریق سرور خروجی به اینترنت آزاد متصل می‌گردد.
                    </p>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="animate-fade-up space-y-5" key="s2">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-xs text-slate-400">پورت گوش‌دادن</label>
                      <input type="number" className="input font-mono ltr" dir="ltr" value={port} min={1} max={65535} onChange={(e) => setPort(Number(e.target.value))} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs text-slate-400">رمزنگاری</label>
                      <select className="input" value={enc} onChange={(e) => setEnc(e.target.value)}>
                        {(ENC_OPTIONS[protocol] ?? [meta.enc]).map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
                      <span>MTU</span>
                      <span className="font-mono text-cyan-300 ltr">{faNum(mtu)}</span>
                    </label>
                    <input type="range" min={1280} max={1500} step={20} value={mtu} onChange={(e) => setMtu(Number(e.target.value))} className="w-full" dir="ltr" />
                    <div className="flex justify-between text-[10px] text-slate-600"><span>1280 (پایدارتر روی شبکه‌های ضعیف)</span><span>1500</span></div>
                  </div>
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4 text-xs leading-6 text-slate-300">
                    <b className="text-cyan-200">خلاصهٔ تانل:</b> «{name.trim() || "بدون‌نام"}» با پروتکل {meta.name} بین{" "}
                    {entries.find((s) => s.id === entryId)?.name ?? "—"} و {exits.find((s) => s.id === exitId)?.name ?? "—"} روی پورت{" "}
                    <span className="font-mono ltr">{faNum(port)}</span> با رمزنگاری {enc}.
                  </div>
                </div>
              )}
            </div>

            {err && <div className="mx-6 mb-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3.5 py-2 text-xs text-rose-200">{err}</div>}

            <div className="flex items-center justify-between border-t border-white/5 px-6 py-4">
              <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="btn btn-soft text-xs">
                <ChevronRight size={14} /> قبلی
              </button>
              {step < 2 ? (
                <button onClick={() => setStep((s) => Math.min(2, s + 1))} disabled={!canNext} className="btn btn-primary text-xs">
                  بعدی <ChevronLeft size={14} />
                </button>
              ) : (
                <button onClick={create} disabled={!canNext || creating} className="btn btn-primary text-xs">
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {creating ? "در حال ساخت و راه‌اندازی…" : "ایجاد و راه‌اندازی تانل"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
