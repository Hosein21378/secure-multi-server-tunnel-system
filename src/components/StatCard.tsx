"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Sparkline } from "@/components/charts";
import { faNum, faNum1 } from "@/lib/format";
import { TrendingDown, TrendingUp } from "lucide-react";

export function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(target * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

export default function StatCard({
  icon,
  label,
  value,
  suffix,
  decimals = 0,
  delta,
  deltaUp = true,
  good = true,
  spark,
  color = "#22d3ee",
  delay = 0,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  delta?: string;
  deltaUp?: boolean;
  good?: boolean;
  spark?: number[];
  color?: string;
  delay?: number;
}) {
  const v = useCountUp(value);
  const fmt = (x: number) => (decimals > 0 ? faNum1(x) : faNum(x));
  return (
    <div className="glass-panel card-hover animate-fade-up relative overflow-hidden rounded-2xl p-5" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full blur-3xl"
        style={{ background: `${color}1f` }}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10"
              style={{ color, background: `${color}14`, boxShadow: `0 0 18px -4px ${color}55` }}
            >
              {icon}
            </span>
            {label}
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-mono text-[26px] font-bold leading-none text-white">{fmt(v)}</span>
            {suffix && <span className="text-xs text-slate-500">{suffix}</span>}
          </div>
          {delta && (
            <div className={`mt-2 flex items-center gap-1 text-[11px] ${good ? "text-emerald-400" : "text-rose-400"}`}>
              {deltaUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{delta}</span>
            </div>
          )}
        </div>
        {spark && <div className="pt-6 opacity-90"><Sparkline data={spark} color={color} width={104} height={36} /></div>}
      </div>
    </div>
  );
}
