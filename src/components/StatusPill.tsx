import { STATUS_FA } from "@/lib/constants";

const TONES: Record<string, { dot: string; cls: string }> = {
  online: { dot: "bg-emerald-400", cls: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" },
  active: { dot: "bg-emerald-400", cls: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" },
  success: { dot: "bg-emerald-400", cls: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" },
  paused: { dot: "bg-amber-400", cls: "border-amber-400/30 bg-amber-400/10 text-amber-300" },
  degraded: { dot: "bg-amber-400", cls: "border-amber-400/30 bg-amber-400/10 text-amber-300" },
  running: { dot: "bg-cyan-400", cls: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300" },
  offline: { dot: "bg-rose-400", cls: "border-rose-400/30 bg-rose-400/10 text-rose-300" },
  error: { dot: "bg-rose-400", cls: "border-rose-400/30 bg-rose-400/10 text-rose-300" },
  failed: { dot: "bg-rose-400", cls: "border-rose-400/30 bg-rose-400/10 text-rose-300" },
};

export default function StatusPill({ status, pulse = true }: { status: string; pulse?: boolean }) {
  const tone = TONES[status] ?? TONES.paused;
  return (
    <span className={`chip ${tone.cls}`}>
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (status === "active" || status === "online" || status === "running") && (
          <span className={`absolute h-full w-full animate-ping rounded-full ${tone.dot} opacity-70`} />
        )}
        <span className={`relative h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      </span>
      {STATUS_FA[status] ?? status}
    </span>
  );
}
