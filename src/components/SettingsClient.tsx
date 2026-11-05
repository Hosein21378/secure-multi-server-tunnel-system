"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserCog, KeyRound, Webhook, SlidersHorizontal, ShieldCheck, Loader2, Check, RefreshCw,
  Eye, EyeOff, LogOut, TriangleAlert,
} from "lucide-react";
import CopyButton from "@/components/CopyButton";

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-cyan-500/70" : "bg-white/10"} ${disabled ? "opacity-50" : ""}`}
      aria-pressed={on}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-0.5" : "left-[22px]"}`}
      />
    </button>
  );
}

export default function SettingsClient({
  displayName,
  apiToken,
  autoCheck,
  maintenance,
  username,
}: {
  displayName: string;
  apiToken: string;
  autoCheck: boolean;
  maintenance: boolean;
  username: string;
}) {
  const router = useRouter();

  // profile
  const [name, setName] = useState(displayName);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // password
  const [cur, setCur] = useState("");
  const [nxt, setNxt] = useState("");
  const [cnf, setCnf] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // token
  const [token, setToken] = useState(apiToken);
  const [showToken, setShowToken] = useState(false);
  const [regenBusy, setRegenBusy] = useState(false);

  // prefs
  const [autoU, setAutoU] = useState(autoCheck);
  const [maint, setMaint] = useState(maintenance);

  const patch = async (updates: Record<string, string>) => {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });
    return res.ok;
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg("");
    const ok = await patch({ admin_display_name: name.trim() });
    setProfileMsg(ok ? "ذخیره شد" : "خطا در ذخیره");
    setSavingProfile(false);
    router.refresh();
    setTimeout(() => setProfileMsg(""), 2000);
  };

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (nxt !== cnf) {
      setPwMsg({ ok: false, text: "تکرار رمز عبور جدید مطابق نیست" });
      return;
    }
    setPwBusy(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current: cur, next: nxt }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPwMsg({ ok: false, text: d.error ?? "خطا" });
      } else {
        setPwMsg({ ok: true, text: "رمز عبور با موفقیت تغییر کرد" });
        setCur(""); setNxt(""); setCnf("");
      }
    } finally {
      setPwBusy(false);
    }
  };

  const regen = async () => {
    setRegenBusy(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate_token" }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.token) setToken(d.token);
    } finally {
      setRegenBusy(false);
    }
  };

  const togglePref = async (key: string, value: boolean, apply: (v: boolean) => void) => {
    apply(value);
    await patch({ [key]: value ? "on" : "off" });
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h2 className="text-2xl font-black text-white">تنظیمات <span className="text-grad">پنل و امنیت</span></h2>
        <p className="mt-1 text-xs text-slate-400">مدیریت حساب مدیر، کلیدهای API و رفتار خودکار پنل</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* profile */}
        <section className="glass-panel animate-fade-up rounded-3xl p-5 sm:p-6" style={{ animationDelay: "60ms" }}>
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300"><UserCog size={17} /></span>
            <h3 className="text-sm font-bold text-white">پروفایل مدیر</h3>
          </div>
          <label className="mb-1.5 block text-xs text-slate-400">نام نمایشی</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="mt-3 flex items-center gap-2">
            <button onClick={saveProfile} disabled={savingProfile || !name.trim()} className="btn btn-primary text-xs">
              {savingProfile ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} ذخیره
            </button>
            {profileMsg && <span className={`text-xs ${profileMsg === "ذخیره شد" ? "text-emerald-300" : "text-rose-300"}`}>{profileMsg}</span>}
          </div>
          <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-[11px] text-slate-500">
            نام کاربری ورود: <span className="font-mono text-slate-300 ltr">{username}</span> • نشست فعلی تا ۷ روز معتبر است
          </div>
        </section>

        {/* password */}
        <section className="glass-panel animate-fade-up rounded-3xl p-5 sm:p-6" style={{ animationDelay: "120ms" }}>
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-400/10 text-violet-300"><KeyRound size={17} /></span>
            <h3 className="text-sm font-bold text-white">تغییر رمز عبور</h3>
          </div>
          <form onSubmit={changePw} className="space-y-3">
            {pwMsg && (
              <div className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs ${pwMsg.ok ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-rose-400/30 bg-rose-500/10 text-rose-200"}`}>
                {pwMsg.ok ? <Check size={14} /> : <TriangleAlert size={14} />} {pwMsg.text}
              </div>
            )}
            <input type="password" className="input font-mono" dir="ltr" placeholder="رمز عبور فعلی" value={cur} onChange={(e) => setCur(e.target.value)} required />
            <div className="grid grid-cols-2 gap-3">
              <input type="password" className="input font-mono" dir="ltr" placeholder="رمز جدید (۶+)" value={nxt} onChange={(e) => setNxt(e.target.value)} required minLength={6} />
              <input type="password" className="input font-mono" dir="ltr" placeholder="تکرار رمز جدید" value={cnf} onChange={(e) => setCnf(e.target.value)} required />
            </div>
            <button type="submit" disabled={pwBusy} className="btn btn-primary text-xs">
              {pwBusy ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} به‌روزرسانی رمز
            </button>
            <p className="text-[10.5px] text-slate-600">رمزها با scrypt و salt یکتا هش می‌شوند و هرگز به‌صورت متن ساده ذخیره نمی‌شوند.</p>
          </form>
        </section>

        {/* api token */}
        <section className="glass-panel animate-fade-up rounded-3xl p-5 sm:p-6" style={{ animationDelay: "180ms" }}>
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-300"><Webhook size={17} /></span>
            <h3 className="text-sm font-bold text-white">توکن API و اتصال Agent</h3>
          </div>
          <p className="mb-3 text-[11px] leading-5 text-slate-400">
            از این توکن برای نصب Agent روی سرورهای جدید و دسترسی برنامه‌ای به پنل استفاده می‌شود. آن را محرمانه نگه دارید.
          </p>
          <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-[#070b16] px-4 py-3">
            <code dir="ltr" className="min-w-0 flex-1 truncate font-mono text-[11px] text-cyan-200/90">
              {showToken ? token : `${token.slice(0, 6)}${"•".repeat(24)}${token.slice(-4)}`}
            </code>
            <button onClick={() => setShowToken((s) => !s)} className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
              {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <CopyButton text={token} small />
          </div>
          <button onClick={regen} disabled={regenBusy} className="btn btn-soft mt-3 text-xs">
            {regenBusy ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} تولید توکن جدید (ابطال قبلی)
          </button>
        </section>

        {/* preferences */}
        <section className="glass-panel animate-fade-up rounded-3xl p-5 sm:p-6" style={{ animationDelay: "240ms" }}>
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10 text-amber-300"><SlidersHorizontal size={17} /></span>
            <h3 className="text-sm font-bold text-white">رفتار پنل</h3>
          </div>
          <ul className="space-y-3">
            <li className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
              <div>
                <div className="text-xs font-bold text-slate-100">بررسی خودکار به‌روزرسانی</div>
                <div className="mt-0.5 text-[10.5px] text-slate-500">هر ۲۴ ساعت مخزن GitHub بررسی و در صورت وجود نسخهٔ جدید اطلاع‌رسانی می‌شود</div>
              </div>
              <Toggle on={autoU} onChange={(v) => togglePref("auto_update_check", v, setAutoU)} />
            </li>
            <li className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
              <div>
                <div className="text-xs font-bold text-slate-100">حالت تعمیر و نگهداری</div>
                <div className="mt-0.5 text-[10.5px] text-slate-500">تانل‌ها به‌کار خود ادامه می‌دهند اما ساخت تانل جدید موقتاً غیرفعال می‌شود</div>
              </div>
              <Toggle on={maint} onChange={(v) => togglePref("maintenance_mode", v, setMaint)} />
            </li>
          </ul>
          <div className="mt-5 border-t border-white/5 pt-4">
            <button onClick={logout} className="btn btn-danger w-full text-xs">
              <LogOut size={14} /> خروج از حساب مدیریت
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
