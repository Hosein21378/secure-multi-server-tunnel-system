"use client";

import { protocolById } from "@/lib/constants";
import { faNum } from "@/lib/format";

export type TopoNode = {
  id: number;
  name: string;
  city: string;
  ip: string;
  latency: number;
  status: string;
};

export type TopoLink = {
  id: number;
  name: string;
  protocol: string;
  status: string;
  latency: number;
  entryId: number | null;
  exitId: number | null;
};

const W = 1040;
const H = 470;
const X_IN = 895;
const X_OUT = 145;

function ys(count: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [H / 2];
  const top = 86;
  const bottom = H - 72;
  return Array.from({ length: count }, (_, i) => top + (i * (bottom - top)) / (count - 1));
}

function NodeChip({ x, y, node, align }: { x: number; y: number; node: TopoNode; align: "right" | "left" }) {
  const w = 228;
  const h = 88;
  const fx = align === "right" ? x - w + 34 : x - 34;
  return (
    <foreignObject x={fx} y={y - h / 2} width={w} height={h}>
      <div dir="rtl" className="flex h-full items-center">
        <div className="glass-deep w-full rounded-2xl px-3.5 py-2.5 shadow-xl">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[13px] font-bold text-white">{node.name}</span>
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${node.status === "online" ? "bg-emerald-400" : node.status === "degraded" ? "bg-amber-400" : "bg-rose-400"}`}
              style={{ boxShadow: "0 0 8px currentColor" }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="truncate font-mono text-[11px] text-slate-400 ltr">{node.ip}</span>
            <span className="shrink-0 rounded-full bg-cyan-400/10 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">{faNum(node.latency)}ms</span>
          </div>
          <div className="mt-0.5 text-[10px] text-slate-500">{node.city}</div>
        </div>
      </div>
    </foreignObject>
  );
}

export default function Topology({ entries, exits, links }: { entries: TopoNode[]; exits: TopoNode[]; links: TopoLink[] }) {
  const inYs = ys(entries.length);
  const outYs = ys(exits.length);
  const inY = (id: number | null) => inYs[entries.findIndex((n) => n.id === id)] ?? H / 2;
  const outY = (id: number | null) => outYs[exits.findIndex((n) => n.id === id)] ?? H / 2;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[680px]" style={{ width: "100%" }}>
        <defs>
          <radialGradient id="hub-g" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
          <filter id="t-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* links */}
        {links.map((l) => {
          if (l.entryId == null || l.exitId == null) return null;
          if (!entries.some((n) => n.id === l.entryId) || !exits.some((n) => n.id === l.exitId)) return null;
          const y1 = inY(l.entryId);
          const y2 = outY(l.exitId);
          const d = `M ${X_IN - 34} ${y1} C 660 ${y1}, 380 ${y2}, ${X_OUT + 34} ${y2}`;
          const proto = protocolById(l.protocol);
          const active = l.status === "active";
          return (
            <g key={l.id}>
              <path d={d} fill="none" stroke={active ? proto.color : "#475569"} strokeOpacity={active ? 0.16 : 0.15} strokeWidth={active ? 5.5 : 3} strokeLinecap="round" />
              <path
                id={`tp-${l.id}`}
                d={d}
                fill="none"
                stroke={active ? proto.color : "#475569"}
                strokeOpacity={active ? 0.75 : 0.35}
                strokeWidth="1.6"
                className={active ? "dash-flow" : undefined}
                strokeDasharray={active ? undefined : "4 10"}
                filter={active ? "url(#t-glow)" : undefined}
              />
              {active &&
                [0, 1, 2].map((k) => (
                  <circle key={k} r={k === 0 ? 3.6 : 2.6} fill={proto.color} opacity={k === 0 ? 1 : 0.65}>
                    <animateMotion dur={`${2.8 + (l.id % 3) * 0.9}s`} begin={`${k * 0.9}s`} repeatCount="indefinite" path={d} />
                  </circle>
                ))}
            </g>
          );
        })}

        {/* hub */}
        <circle cx={W / 2} cy={H / 2} r="58" fill="url(#hub-g)" opacity="0.22" />
        <circle cx={W / 2} cy={H / 2} r="7" fill="#22d3ee">
          <animate attributeName="r" values="6;9;6" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle cx={W / 2} cy={H / 2} r="16" fill="none" stroke="#22d3ee" strokeOpacity="0.5">
          <animate attributeName="r" values="10;26" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0.6;0" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <foreignObject x={W / 2 - 105} y={H / 2 + 26} width={210} height={40}>
          <div dir="rtl" className="text-center">
            <span className="rounded-full border border-cyan-400/25 bg-[#0b1120]/85 px-3 py-1 text-[10px] text-cyan-200 backdrop-blur">
              هستهٔ Nova — مسیریابی رمزنگاری‌شده
            </span>
          </div>
        </foreignObject>

        {/* entry nodes (right side = Iran) */}
        {entries.map((n, i) => (
          <g key={n.id}>
            <circle cx={X_IN} cy={inYs[i]} r="10" fill="none" stroke="#34d399" strokeOpacity="0.4">
              <animate attributeName="r" values="8;20" dur="2.6s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
              <animate attributeName="stroke-opacity" values="0.45;0" dur="2.6s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
            </circle>
            <circle cx={X_IN} cy={inYs[i]} r="6.5" fill="#34d399" stroke="#05070f" strokeWidth="2" />
            <NodeChip x={X_IN} y={inYs[i]} node={n} align="right" />
          </g>
        ))}

        {/* exit nodes (left side) */}
        {exits.map((n, i) => (
          <g key={n.id}>
            <circle cx={X_OUT} cy={outYs[i]} r="10" fill="none" stroke="#a78bfa" strokeOpacity="0.4">
              <animate attributeName="r" values="8;20" dur="2.6s" begin={`${0.4 + i * 0.5}s`} repeatCount="indefinite" />
              <animate attributeName="stroke-opacity" values="0.45;0" dur="2.6s" begin={`${0.4 + i * 0.5}s`} repeatCount="indefinite" />
            </circle>
            <circle
              cx={X_OUT}
              cy={outYs[i]}
              r="6.5"
              fill={n.status === "online" ? "#a78bfa" : n.status === "degraded" ? "#fbbf24" : "#fb7185"}
              stroke="#05070f"
              strokeWidth="2"
            />
            <NodeChip x={X_OUT} y={outYs[i]} node={n} align="left" />
          </g>
        ))}

        {/* column headers */}
        <foreignObject x={X_IN - 100} y={14} width={200} height={30}>
          <div dir="rtl" className="text-center text-[11px] font-bold text-emerald-300/90">سرورهای ورودی — داخل کشور</div>
        </foreignObject>
        <foreignObject x={X_OUT - 100} y={14} width={200} height={30}>
          <div dir="rtl" className="text-center text-[11px] font-bold text-violet-300/90">سرورهای خروجی — خارج</div>
        </foreignObject>
      </svg>
    </div>
  );
}
