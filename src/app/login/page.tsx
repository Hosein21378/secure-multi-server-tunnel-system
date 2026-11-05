import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import BackgroundFX from "@/components/BackgroundFX";
import LoginForm from "@/components/LoginForm";
import { Logo } from "@/components/PanelShell";
import { PRODUCT } from "@/lib/constants";
import { ShieldCheck, Zap, RefreshCcw, GitBranch, Fingerprint } from "lucide-react";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  const features = [
    { icon: ShieldCheck, title: "امنیت در سطح نظامی", desc: "AES-256-GCM / ChaCha20-Poly1305 با چرخش خودکار کلید و PFS" },
    { icon: Zap, title: "پینگ زیر ۳۰ میلی‌ثانیه", desc: "مسیریابی هوشمند و BBR/Brutal بدون افت سرعت و کیفیت" },
    { icon: RefreshCcw, title: "آپدیت بدون ورود به سرور", desc: "دریافت و نصب نسخه‌های جدید مستقیم از داخل پنل — بدون قطعی" },
  ];

  return (
    <div className="relative min-h-svh">
      <BackgroundFX />
      <div className="relative mx-auto grid min-h-svh w-full max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[1.15fr_0.85fr]">
        {/* brand side */}
        <div className="animate-fade-up hidden lg:block">
          <div className="flex items-center gap-4">
            <Logo size={64} />
            <div>
              <h1 className="text-3xl font-black text-white">
                {PRODUCT.faName} <span className="text-grad text-xl font-extrabold ltr">{PRODUCT.name}</span>
              </h1>
              <p className="mt-1 text-sm text-slate-400">{PRODUCT.tagline}</p>
            </div>
          </div>

          <div className="mt-10 space-y-5">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="glass-panel animate-fade-up flex items-start gap-4 rounded-2xl p-4"
                style={{ animationDelay: `${120 + i * 120}ms` }}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300 shadow-[0_0_24px_-6px_rgba(34,211,238,0.6)]">
                  <f.icon size={20} />
                </span>
                <div>
                  <div className="text-sm font-bold text-white">{f.title}</div>
                  <div className="mt-0.5 text-xs leading-5 text-slate-400">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-3 text-[11px] text-slate-500">
            <span className="chip"><GitBranch size={12} className="text-violet-300" /><span className="font-mono ltr">{PRODUCT.repo}</span></span>
            <span className="chip"><Fingerprint size={12} className="text-emerald-300" /> متن‌باز و قابل حسابرسی</span>
          </div>
        </div>

        {/* form side */}
        <div className="animate-fade-up mx-auto w-full max-w-md" style={{ animationDelay: "100ms" }}>
          <div className="glass-deep relative overflow-hidden rounded-3xl p-7 shadow-2xl sm:p-9">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-cyan-500/15 blur-3xl" />
            <div className="relative mb-7 flex flex-col items-center text-center">
              <div className="lg:hidden mb-3"><Logo size={52} /></div>
              <h2 className="text-xl font-extrabold text-white">ورود به پنل مدیریت</h2>
              <p className="mt-1.5 text-xs leading-5 text-slate-400">
                نشست با کوکی امضاشدهٔ HMAC و رمزنگاری TLS 1.3 محافظت می‌شود
              </p>
            </div>
            <LoginForm />
            <p className="mt-6 text-center text-[10px] text-slate-600">
              {PRODUCT.faName} — دسترسی فقط برای مدیران مجاز. تمام تلاش‌های ورود ثبت می‌شود.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
