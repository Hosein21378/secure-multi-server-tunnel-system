"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Waypoints,
  Server,
  ArrowUpCircle,
  Settings,
  LogOut,
  Menu,
  X,
  GitBranch,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { PRODUCT } from "@/lib/constants";

const NAV = [
  { href: "/", label: "داشبورد", icon: LayoutDashboard },
  { href: "/tunnels", label: "تانل‌ها", icon: Waypoints },
  { href: "/servers", label: "سرورها", icon: Server },
  { href: "/updates", label: "به‌روزرسانی", icon: ArrowUpCircle },
  { href: "/settings", label: "تنظیمات", icon: Settings },
];

const TITLES: [string, string][] = [
  ["/tunnels", "مدیریت تانل‌ها"],
  ["/servers", "مدیریت سرورها"],
  ["/updates", "به‌روزرسانی پنل و هسته"],
  ["/settings", "تنظیمات"],
  ["/", "داشبورد زیرساخت"],
];

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="lg-hex" x1="4" y1="4" x2="44" y2="44">
          <stop stopColor="#22d3ee" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <path
        d="M24 3 42.5 13.5v21L24 45 5.5 34.5v-21L24 3Z"
        stroke="url(#lg-hex)"
        strokeWidth="2.4"
        fill="rgba(34,211,238,0.06)"
      />
      <path d="M14 29.5 24 18l10 11.5" stroke="url(#lg-hex)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="14" cy="31" r="3" fill="#22d3ee" />
      <circle cx="34" cy="31" r="3" fill="#8b5cf6" />
      <circle cx="24" cy="16.4" r="3" fill="#34d399" />
    </svg>
  );
}

export default function PanelShell({
  children,
  userName,
  version,
}: {
  children: ReactNode;
  userName: string;
  version: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [clock, setClock] = useState("");

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("fa-IR", {
      timeZone: "Asia/Tehran",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const update = () => setClock(fmt.format(new Date()));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const title =
    pathname.startsWith("/tunnels/") ? "جزئیات تانل" : TITLES.find(([p]) => (p === "/" ? pathname === "/" : pathname.startsWith(p)))?.[1] ?? "پنل مدیریت";

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 pt-6 pb-5">
        <Logo />
        <div className="leading-tight">
          <div className="text-lg font-extrabold text-white">
            {PRODUCT.faName} <span className="text-grad text-sm font-bold ltr">{PRODUCT.name}</span>
          </div>
          <div className="text-[11px] text-slate-400">مدیریت تانل امن چند‌سروره</div>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-300 ${
                active ? "bg-white/[0.08] text-white" : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100"
              }`}
            >
              {active && (
                <span className="absolute inset-y-2 right-0 w-[3px] rounded-full bg-gradient-to-b from-cyan-400 to-violet-500 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
              )}
              <Icon size={18} className={active ? "text-cyan-300" : "text-slate-500 group-hover:text-slate-300"} />
              <span>{item.label}</span>
              {item.href === "/updates" && (
                <span className="mr-auto rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-bold text-violet-300">جدید</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 px-4 pb-6">
        <div className="glass-panel rounded-2xl p-3.5">
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-300">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>اتصال پنل رمزنگاری‌شده</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-full rounded-full bg-gradient-to-l from-cyan-400 via-violet-400 to-emerald-400 opacity-80" />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
            <span>TLS 1.3</span>
            <span className="ltr font-mono">v{version}</span>
          </div>
        </div>
        <a
          href={PRODUCT.repoUrl}
          target="_blank"
          rel="noreferrer"
          className="btn btn-soft w-full !py-2 text-xs"
        >
          <GitBranch size={14} />
          <span className="ltr font-mono">{PRODUCT.repo}</span>
        </a>
      </div>
    </div>
  );

  return (
    <div className="relative flex min-h-svh">
      {/* desktop sidebar */}
      <aside className="glass-deep sticky top-0 hidden h-svh w-[272px] shrink-0 overflow-y-auto border-l lg:block">
        {sidebar}
      </aside>

      {/* mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="glass-deep absolute inset-y-0 right-0 w-[280px] animate-fade-up overflow-y-auto border-l">
            <button onClick={() => setOpen(false)} className="absolute left-3 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
              <X size={18} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* topbar */}
        <header className="glass-deep sticky top-0 z-40 flex items-center gap-3 border-b border-white/5 px-4 py-3 sm:px-6">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden">
            <Menu size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-white sm:text-base">{title}</h1>
            <p className="hidden text-[11px] text-slate-500 sm:block">{PRODUCT.tagline}</p>
          </div>

          <div className="mr-auto flex items-center gap-2 sm:gap-3">
            <span className="chip hidden border-emerald-400/30 bg-emerald-400/10 text-emerald-300 sm:inline-flex">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              همهٔ سیستم‌ها پایدار
            </span>
            <span className="chip hidden font-mono text-slate-300 md:inline-flex">Tehran {clock || "--:--:--"}</span>
            <span className="chip hidden font-mono text-cyan-300 sm:inline-flex ltr">v{version}</span>

            <div className="relative">
              <button
                onClick={() => setMenu((m) => !m)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-sm text-slate-200 hover:bg-white/10"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 text-xs font-bold text-white">
                  {userName.trim().slice(0, 1) || "م"}
                </span>
                <span className="hidden max-w-24 truncate sm:block">{userName}</span>
                <ChevronDown size={14} className="text-slate-500" />
              </button>
              {menu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
                  <div className="glass-deep absolute left-0 z-50 mt-2 w-44 overflow-hidden rounded-xl p-1.5 shadow-2xl">
                    <Link href="/settings" onClick={() => setMenu(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-white/10 hover:text-white">
                      <Settings size={14} /> تنظیمات حساب
                    </Link>
                    <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/10">
                      <LogOut size={14} /> خروج از حساب
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>

        <footer className="border-t border-white/5 px-6 py-4 text-center text-[11px] text-slate-600">
          {PRODUCT.faName} • پروژهٔ متن‌باز روی{" "}
          <a href={PRODUCT.repoUrl} target="_blank" rel="noreferrer" className="text-slate-400 underline-offset-4 hover:underline ltr font-mono">
            {PRODUCT.repo}
          </a>{" "}
          • آپدیت مستقیم از داخل پنل، بدون نیاز به ورود به سرور
        </footer>
      </div>
    </div>
  );
}
