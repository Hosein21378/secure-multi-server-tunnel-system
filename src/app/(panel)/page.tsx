import Link from "next/link";
import {
  Waypoints,
  Server,
  Activity,
  Database,
  Plus,
  ArrowUpCircle,
  Lock,
  KeyRound,
  EyeOff,
  ShieldCheck,
  ChevronLeft,
  Zap,
} from "lucide-react";
import { listServers, listTunnels, listReleases } from "@/lib/data";
import { getPanelVersion, compareVersions } from "@/lib/seed";
import { faNum, faNum1, faGb } from "@/lib/format";
import { genWalk } from "@/lib/series";
import { protocolById } from "@/lib/constants";
import StatCard from "@/components/StatCard";
import StatusPill from "@/components/StatusPill";
import Topology from "@/components/Topology";
import { LiveAreaChart, Donut, AreaChart } from "@/components/charts";

export default async function DashboardPage() {
  const [servers, tunnels, releases, current] = await Promise.all([
    listServers(),
    listTunnels(),
    listReleases(),
    getPanelVersion(),
  ]);

  const activeTunnels = tunnels.filter((t) => t.status === "active");
  const onlineServers = servers.filter((s) => s.status === "online");
  const avgLatency = activeTunnels.length
    ? Math.round(activeTunnels.reduce((a, t) => a + t.latency, 0) / activeTunnels.length)
    : 0;
  const totalTrafficGb = tunnels.reduce((a, t) => a + t.trafficGb, 0);
  const totalThroughput = activeTunnels.reduce((a, t) => a + t.throughput, 0);
  const updateAvailable = releases.some((r) => compareVersions(r.version, current) > 0);

  const donut = Array.from(
    tunnels.reduce((m, t) => m.set(t.protocol, (m.get(t.protocol) ?? 0) + 1), new Map<string, number>())
  ).map(([id, value]) => ({ label: protocolById(id).name, value, color: protocolById(id).color }));

  const dateLine = new Intl.DateTimeFormat("fa-IR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  const toNode = (s: (typeof servers)[number]) => ({
    id: s.id,
    name: s.name,
    city: s.city,
    ip: s.ip,
    latency: s.latency,
    status: s.status,
  });
  const entries = servers.filter((s) => s.role === "entry").map(toNode);
  const exits = servers.filter((s) => s.role !== "entry").map(toNode);
  const links = tunnels.map((t) => ({
    id: t.id,
    name: t.name,
    protocol: t.protocol,
    status: t.status,
    latency: t.latency,
    entryId: t.entryServerId,
    exitId: t.exitServerId,
  }));

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">
            مرور <span className="text-grad">زیرساخت تانل</span>
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {dateLine} • {faNum(onlineServers.length)} سرور آنلاین • گذردهی لحظه‌ای{" "}
            <span className="font-mono text-cyan-300 ltr">{faNum(totalThroughput)} Mbps</span>
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/updates" className="btn btn-soft relative">
            <ArrowUpCircle size={16} />
            به‌روزرسانی
            {updateAvailable && <span className="absolute -left-1 -top-1 h-2.5 w-2.5 animate-blink rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.9)]" />}
          </Link>
          <Link href="/tunnels" className="btn btn-primary">
            <Plus size={16} />
            تانل جدید
          </Link>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Waypoints size={16} />} label="تانل‌های فعال" value={activeTunnels.length} suffix={`از ${faNum(tunnels.length)}`} spark={genWalk("st-tun", 20, 4, 1.4, 2, 6)} color="#22d3ee" delta={`${faNum(12)}٪ رشد این ماه`} delay={0} />
        <StatCard icon={<Server size={16} />} label="سرورهای آنلاین" value={onlineServers.length} suffix={`از ${faNum(servers.length)}`} spark={genWalk("st-srv", 20, 5, 0.8, 3, 7)} color="#34d399" delta="آپتایم ۹۹٫۹۸٪" delay={80} />
        <StatCard icon={<Activity size={16} />} label="میانگین پینگ" value={avgLatency} suffix="ms" spark={genWalk("st-lat", 20, 24, 5, 12, 44)} color="#fbbf24" delta={`${faNum1(8.2)}٪ بهتر از دیروز`} deltaUp={false} delay={160} />
        <StatCard icon={<Database size={16} />} label="ترافیک کل (۳۰ روز)" value={totalTrafficGb / 1024} decimals={1} suffix="ترابایت" spark={genWalk("st-trf", 20, 14, 3, 8, 22)} color="#a78bfa" delay={240} />
      </div>

      {/* topology */}
      <section className="glass-panel animate-fade-up rounded-3xl p-5 sm:p-6" style={{ animationDelay: "160ms" }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
              <Zap size={17} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">نقشهٔ زندهٔ تانل‌ها</h3>
              <p className="text-[11px] text-slate-500">جریان بسته‌ها بین سرورهای ورودی و خروجی — به‌صورت لحظه‌ای</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            {["#22d3ee", "#34d399", "#a78bfa", "#f59e0b"].map((c, i) => (
              <span key={i} className="chip">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
                {["Hysteria2", "WireGuard", "Reality", "GRE"][i]}
              </span>
            ))}
          </div>
        </div>
        <Topology entries={entries} exits={exits} links={links} />
      </section>

      {/* charts + security */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="glass-panel animate-fade-up rounded-3xl p-5 sm:p-6 xl:col-span-2" style={{ animationDelay: "240ms" }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">پینگ لحظه‌ای میان‌سرورها</h3>
              <p className="text-[11px] text-slate-500">میانگین تأخر رفت‌وبرگشت روی همهٔ تانل‌های فعال</p>
            </div>
          </div>
          <LiveAreaChart
            initial={genWalk("dash-live", 56, avgLatency || 24, 6, Math.max(6, avgLatency - 12), avgLatency + 30)}
            volatility={5}
            min={Math.max(6, avgLatency - 12)}
            max={avgLatency + 30}
            color="#22d3ee"
            unit="ms"
            height={210}
          />
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/5 pt-4 text-center">
            {[
              { l: "کمترین", v: genWalk("dash-live", 56, avgLatency || 24, 6, 6, 90).reduce((a, b) => Math.min(a, b), 999) },
              { l: "میانگین", v: avgLatency },
              { l: "بیشترین", v: (avgLatency || 24) + 26 },
            ].map((x) => (
              <div key={x.l}>
                <div className="font-mono text-lg font-bold text-white ltr">{faNum(x.v)}</div>
                <div className="text-[10px] text-slate-500">{x.l} (ms)</div>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel animate-fade-up rounded-3xl p-5 sm:p-6" style={{ animationDelay: "320ms" }}>
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
              <ShieldCheck size={17} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">وضعیت امنیت</h3>
              <p className="text-[11px] text-slate-500">سطح محافظت: حداکثری</p>
            </div>
          </div>
          <ul className="space-y-3">
            {[
              { icon: Lock, t: "رمزنگاری سراسری", d: "AES-256-GCM / ChaCha20 روی همهٔ تانل‌ها" },
              { icon: KeyRound, t: "چرخش خودکار کلید", d: "هر ۶ ساعت — آخرین چرخش: ۴۷ دقیقه پیش" },
              { icon: EyeOff, t: "سیاست بدون لاگ", d: "هیچ گزارش اتصالی روی دیسک ذخیره نمی‌شود" },
              { icon: ShieldCheck, t: "Perfect Forward Secrecy", d: "کلید هر نشست مستقل تولید می‌شود" },
            ].map((r, i) => (
              <li key={i} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-3.5 py-3">
                <r.icon size={17} className="shrink-0 text-emerald-300" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-100">{r.t}</div>
                  <div className="truncate text-[10.5px] text-slate-500">{r.d}</div>
                </div>
                <span className="chip border-emerald-400/25 bg-emerald-400/10 text-emerald-300">فعال</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* donut + 24h traffic */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="glass-panel animate-fade-up rounded-3xl p-5 sm:p-6" style={{ animationDelay: "380ms" }}>
          <h3 className="mb-5 text-sm font-bold text-white">توزیع پروتکل‌ها</h3>
          {donut.length > 0 ? <Donut segments={donut} centerLabel="تانل" /> : <p className="text-xs text-slate-500">تانلی وجود ندارد.</p>}
        </section>
        <section className="glass-panel animate-fade-up rounded-3xl p-5 sm:p-6 xl:col-span-2" style={{ animationDelay: "440ms" }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">ترافیک ۲۴ ساعت گذشته</h3>
              <p className="text-[11px] text-slate-500">مجموع گذردهی خروجی — بدون افت سرعت</p>
            </div>
            <span className="chip font-mono text-violet-300 ltr">{faGb(totalTrafficGb)}</span>
          </div>
          <AreaChart data={genWalk("dash-24h", 48, 720, 160, 240, 1200)} color="#a78bfa" height={170} unit="Mbps" />
        </section>
      </div>

      {/* tunnels table */}
      <section className="glass-panel animate-fade-up overflow-hidden rounded-3xl" style={{ animationDelay: "520ms" }}>
        <div className="flex items-center justify-between px-5 py-4 sm:px-6">
          <h3 className="text-sm font-bold text-white">تانل‌های فعال</h3>
          <Link href="/tunnels" className="flex items-center gap-1 text-xs text-cyan-300 hover:text-cyan-200">
            مدیریت کامل
            <ChevronLeft size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-right text-xs">
            <thead>
              <tr className="border-y border-white/5 bg-white/[0.03] text-[11px] text-slate-500">
                <th className="px-6 py-3 font-medium">نام تانل</th>
                <th className="px-4 py-3 font-medium">پروتکل</th>
                <th className="px-4 py-3 font-medium">مسیر</th>
                <th className="px-4 py-3 font-medium">پورت</th>
                <th className="px-4 py-3 font-medium">پینگ</th>
                <th className="px-4 py-3 font-medium">گذردهی</th>
                <th className="px-4 py-3 font-medium">وضعیت</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {tunnels.map((t) => {
                const p = protocolById(t.protocol);
                return (
                  <tr key={t.id} className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]">
                    <td className="px-6 py-3.5 font-bold text-slate-100">{t.name}</td>
                    <td className="px-4 py-3.5">
                      <span className="chip" style={{ borderColor: `${p.color}44`, background: `${p.color}14`, color: p.color }}>
                        {p.name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">
                      {t.entry?.city ?? "—"} ⇄ {t.exit?.city ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-400 ltr">:{t.port}</td>
                    <td className="px-4 py-3.5 font-mono text-cyan-300 ltr">{faNum(t.latency)}ms</td>
                    <td className="px-4 py-3.5 font-mono text-slate-300 ltr">{faNum(t.throughput)} Mbps</td>
                    <td className="px-4 py-3.5"><StatusPill status={t.status} /></td>
                    <td className="px-4 py-3.5">
                      <Link href={`/tunnels/${t.id}`} className="text-cyan-300 hover:text-cyan-200">جزئیات</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
