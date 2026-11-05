"use client";

import { useEffect, useId, useRef, useState } from "react";
import { areaPath, smoothPath, toPoints } from "@/lib/series";
import { clamp, faNum } from "@/lib/format";

const VW = 720;

/* ---------------- AreaChart ---------------- */
export function AreaChart({
  data,
  color = "#22d3ee",
  height = 180,
  unit = "",
  formatter,
  gridLines = 3,
}: {
  data: number[];
  color?: string;
  height?: number;
  unit?: string;
  formatter?: (v: number) => string;
  gridLines?: number;
}) {
  const gid = useId().replace(/:/g, "");
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const pts = toPoints(data, VW, height, 8);
  const line = smoothPath(pts);
  const area = areaPath(pts, height);
  const fmt = formatter ?? ((v: number) => faNum(v));

  const onMove = (e: React.MouseEvent) => {
    const el = wrapRef.current;
    if (!el || data.length < 2) return;
    const rect = el.getBoundingClientRect();
    const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    setHover(Math.round(ratio * (data.length - 1)));
  };

  const hx = hover != null && pts[hover] ? pts[hover].x : 0;
  const hy = hover != null && pts[hover] ? pts[hover].y : 0;

  return (
    <div ref={wrapRef} className="relative w-full" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${VW} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`g-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`l-${gid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.55" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        {Array.from({ length: gridLines }).map((_, i) => {
          const y = ((i + 1) * height) / (gridLines + 1);
          return <line key={i} x1="0" x2={VW} y1={y} y2={y} stroke="rgba(148,163,184,0.1)" strokeDasharray="3 6" />;
        })}
        {area && <path d={area} fill={`url(#g-${gid})`} />}
        {line && (
          <path d={line} fill="none" stroke={`url(#l-${gid})`} strokeWidth="2.4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        )}
        {hover != null && pts[hover] && (
          <g>
            <line x1={hx} x2={hx} y1="0" y2={height} stroke="rgba(255,255,255,0.25)" strokeDasharray="2 4" />
            <circle cx={hx} cy={hy} r="9" fill={color} opacity="0.18" />
            <circle cx={hx} cy={hy} r="4" fill={color} stroke="#05070f" strokeWidth="2" />
          </g>
        )}
      </svg>
      {hover != null && data[hover] != null && (
        <div
          className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 rounded-lg border border-white/10 bg-[#0b1120]/95 px-2.5 py-1 text-[11px] text-white shadow-xl backdrop-blur"
          style={{ left: `${clamp((hx / VW) * 100, 8, 92)}%` }}
        >
          <span className="font-bold" style={{ color }}>{fmt(data[hover])}</span>
          {unit && <span className="mr-1 text-slate-400">{unit}</span>}
        </div>
      )}
    </div>
  );
}

/* ---------------- LiveAreaChart ---------------- */
export function LiveAreaChart({
  initial,
  volatility = 6,
  min = 5,
  max = 90,
  tickMs = 1300,
  color = "#22d3ee",
  height = 180,
  unit = "ms",
  formatter,
  liveLabel = "زنده",
}: {
  initial: number[];
  volatility?: number;
  min?: number;
  max?: number;
  tickMs?: number;
  color?: string;
  height?: number;
  unit?: string;
  formatter?: (v: number) => string;
  liveLabel?: string;
}) {
  const [data, setData] = useState<number[]>(initial);

  useEffect(() => {
    const t = setInterval(() => {
      setData((prev) => {
        const last = prev[prev.length - 1] ?? (min + max) / 2;
        const next = clamp(last + (Math.random() - 0.5) * volatility, min, max);
        return [...prev.slice(1), Math.round(next * 100) / 100];
      });
    }, tickMs);
    return () => clearInterval(t);
  }, [volatility, min, max, tickMs]);

  const current = data[data.length - 1] ?? 0;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="chip border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute h-full w-full animate-ping rounded-full bg-cyan-400 opacity-70" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-cyan-400" />
          </span>
          {liveLabel}
        </span>
        <span className="font-mono text-lg font-bold text-white ltr" dir="ltr">
          {(formatter ?? ((v: number) => faNum(v)))(current)}
          <span className="mr-1 text-xs font-normal text-slate-500">{unit}</span>
        </span>
      </div>
      <AreaChart data={data} color={color} height={height} unit={unit} formatter={formatter} />
    </div>
  );
}

/* ---------------- Sparkline ---------------- */
export function Sparkline({ data, color = "#22d3ee", width = 120, height = 34 }: { data: number[]; color?: string; width?: number; height?: number }) {
  const gid = useId().replace(/:/g, "");
  const pts = toPoints(data, width, height, 3);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`s-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath(pts, height)} fill={`url(#s-${gid})`} />
      <path d={smoothPath(pts)} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------- Gauge ---------------- */
export function Gauge({
  value,
  min = 0,
  max = 100,
  label,
  unit,
  size = 168,
  color,
  formatter,
}: {
  value: number;
  min?: number;
  max?: number;
  label: string;
  unit: string;
  size?: number;
  color?: string;
  formatter?: (v: number) => string;
}) {
  const gid = useId().replace(/:/g, "");
  const pct = clamp((value - min) / (max - min || 1), 0, 1);
  const auto = pct < 0.45 ? "#22d3ee" : pct < 0.75 ? "#fbbf24" : "#fb7185";
  const c = color ?? auto;
  const cx = size / 2;
  const cy = size / 2 + 8;
  const r = size / 2 - 16;
  const fmt = formatter ?? ((v: number) => faNum(v));

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.62} viewBox={`0 0 ${size} ${size * 0.62}`}>
        <defs>
          <linearGradient id={`gg-${gid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={c} stopOpacity="0.35" />
            <stop offset="100%" stopColor={c} />
          </linearGradient>
        </defs>
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="rgba(148,163,184,0.14)" strokeWidth="9" strokeLinecap="round" pathLength={100} />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={`url(#gg-${gid})`}
          strokeWidth="9"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${pct * 100} 100`}
          style={{ filter: `drop-shadow(0 0 8px ${c}66)`, transition: "stroke-dasharray 0.8s cubic-bezier(0.22,1,0.36,1)" }}
        />
        <text x={cx} y={cy - 12} textAnchor="middle" fill="#fff" fontSize="26" fontWeight="800" fontFamily="JetBrains Mono, monospace">
          {fmt(value)}
        </text>
        <text x={cx} y={cy + 4} textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="JetBrains Mono, monospace">
          {unit}
        </text>
      </svg>
      <span className="-mt-2.5 text-xs text-slate-400">{label}</span>
    </div>
  );
}

/* ---------------- Donut ---------------- */
export function Donut({
  segments,
  centerLabel,
  size = 150,
}: {
  segments: { label: string; value: number; color: string }[];
  centerLabel: string;
  size?: number;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = 56;
  const C = 2 * Math.PI * r;
  let acc = 0;

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox="0 0 140 140" className="shrink-0">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="13" />
        {segments.map((s, i) => {
          const len = (s.value / total) * C;
          const el = (
            <circle
              key={i}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="13"
              strokeLinecap="round"
              strokeDasharray={`${Math.max(0, len - 3)} ${C - len + 3}`}
              strokeDashoffset={-acc}
              transform="rotate(-90 70 70)"
              style={{ filter: `drop-shadow(0 0 6px ${s.color}55)` }}
            />
          );
          acc += len;
          return el;
        })}
        <text x="70" y="66" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="800" fontFamily="Vazirmatn, sans-serif">
          {faNum(total)}
        </text>
        <text x="70" y="84" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="Vazirmatn, sans-serif">
          {centerLabel}
        </text>
      </svg>
      <div className="space-y-1.5">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
            <span>{s.label}</span>
            <span className="font-mono text-slate-500">{faNum(((s.value / total) * 100))}٪</span>
          </div>
        ))}
      </div>
    </div>
  );
}
