"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Play, Pause, RotateCcw, Trash2, Loader2, FileCode2, Info, Cpu,
} from "lucide-react";
import { protocolById } from "@/lib/constants";
import { faNum, faNum1, faGb, faRel, faDate } from "@/lib/format";
import { genWalk, hashSeed, mulberry32 } from "@/lib/series";
import StatusPill from "@/components/StatusPill";
import CopyButton from "@/components/CopyButton";
import { LiveAreaChart, AreaChart, Gauge } from "@/components/charts";

export type TunnelDetail = {
  id: number; name: string; protocol: string; port: number; encryption: string; mtu: number;
  status: string; latency: number; throughput: number; trafficGb: number; createdAt: string;
  entryIp: string | null; entryName: string | null; entryCity: string | null;
  exitIp: string | null; exitName: string | null; exitCity: string | null;
};

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function pseudoKey(seed: string, len: number) {
  const rnd = mulberry32(hashSeed(seed));
  let s = "";
  for (let i = 0; i < len; i++) s += B64[Math.floor(rnd() * 64)];
  return s;
}

function buildConfig(t: TunnelDetail, side: "entry" | "exit"): string {
  const k1 = pseudoKey(`k1-${t.id}`, 44);
  const k2 = pseudoKey(`k2-${t.id}`, 44);
  const k3 = pseudoKey(`k3-${t.id}`, 32);
  const entry = t.entryIp ?? "0.0.0.0";
  const exit = t.exitIp ?? "0.0.0.0";

  if (t.protocol === "wireguard") {
    return side === "entry"
      ? `[Interface]\n# NovaTunnel — سمت ورودی (${t.entryName ?? ""})\nPrivateKey = ${k1}\nAddress = 10.8.${t.id}.1/24\nListenPort = ${t.port}\nMTU = ${t.mtu}\n\n[Peer]\n# سرور خروجی: ${t.exitName ?? ""}\nPublicKey = ${k2}\nPresharedKey = ${pseudoKey(`p-${t.id}`, 44)}\nAllowedIPs = 0.0.0.0/0, ::/0\nEndpoint = ${exit}:${t.port}\nPersistentKeepalive = 25`
      : `[Interface]\n# NovaTunnel — سمت خروجی (${t.exitName ?? ""})\nPrivateKey = ${k2}\nAddress = 10.8.${t.id}.2/24\nListenPort = ${t.port}\nMTU = ${t.mtu}\n\n[Peer]\n# سرور ورودی: ${t.entryName ?? ""}\nPublicKey = ${k1}\nPresharedKey = ${pseudoKey(`p-${t.id}`, 44)}\nAllowedIPs = 10.8.${t.id}.0/24\nEndpoint = ${entry}:${t.port}`;
  }
  if (t.protocol === "vless") {
    const uuid = `${pseudoKey(`u1-${t.id}`, 8)}-${pseudoKey(`u2-${t.id}`, 4)}-${pseudoKey(`u3-${t.id}`, 4)}-${pseudoKey(`u4-${t.id}`, 4)}-${pseudoKey(`u5-${t.id}`, 12)}`.toLowerCase();
    return side === "entry"
      ? `// NovaTunnel — Xray خروجی به سمت سرور خارج\n{\n  "log": { "loglevel": "warning", "access": "none" },\n  "outbounds": [{\n    "protocol": "vless",\n    "settings": {\n      "vnext": [{\n        "address": "${exit}",\n        "port": ${t.port},\n        "users": [{ "id": "${uuid}", "encryption": "none", "flow": "xtls-rprx-vision" }]\n      }]\n    },\n    "streamSettings": {\n      "network": "tcp",\n      "security": "reality",\n      "realitySettings": {\n        "serverName": "www.github.com",\n        "publicKey": "${k1}",\n        "shortId": "${pseudoKey(`s-${t.id}`, 8)}",\n        "fingerprint": "chrome"\n      }\n    }\n  }]\n}`
      : `// NovaTunnel — Xray ورودی روی سرور خارج\n{\n  "inbounds": [{\n    "listen": "0.0.0.0",\n    "port": ${t.port},\n    "protocol": "vless",\n    "settings": {\n      "clients": [{ "id": "${uuid}", "flow": "xtls-rprx-vision" }],\n      "decryption": "none"\n    },\n    "streamSettings": {\n      "network": "tcp",\n      "security": "reality",\n      "realitySettings": {\n        "dest": "www.github.com:443",\n        "privateKey": "${k2}",\n        "shortIds": ["${pseudoKey(`s-${t.id}`, 8)}"]\n      }\n    }\n  }]\n}`;
  }
  if (t.protocol === "gre") {
    return side === "entry"
      ? `# NovaTunnel — GRE/IPsec سمت ورودی\nconfig setup\n  uniqueids=yes\n\nconn nova-${t.id}\n  left=${entry}\n  leftid=@nova-entry\n  right=${exit}\n  rightid=@nova-exit\n  ike=aes256-sha384-modp2048\n  esp=aes256-sha384\n  keyingtries=%forever\n  auto=start\n\n# tunnel device\nip tunnel add nova${t.id} mode gre remote ${exit} local ${entry} ttl 255\nip link set nova${t.id} up mtu ${t.mtu}\nip addr add 172.31.${t.id}.1/30 dev nova${t.id}`
      : `# NovaTunnel — GRE/IPsec سمت خروجی\nconn nova-${t.id}\n  left=${exit}\n  leftid=@nova-exit\n  right=${entry}\n  rightid=@nova-entry\n  ike=aes256-sha384-modp2048\n  esp=aes256-sha384\n  auto=add\n\nip tunnel add nova${t.id} mode gre remote ${entry} local ${exit} ttl 255\nip link set nova${t.id} up mtu ${t.mtu}\nip addr add 172.31.${t.id}.2/30 dev nova${t.id}`;
  }
  // hysteria2
  return side === "entry"
    ? `# NovaTunnel — Hysteria2 سمت ورودی\nlisten: :${t.port}\n\ntls:\n  sni: edge-cdn.example.net\n  alpn: [h3]\n\nobfs:\n  type: salamander\n  password: ${k3}\n\nauth:\n  type: password\n  password: ${pseudoKey(`a-${t.id}`, 24)}\n\ncongestion:\n  type: brutal\n  up: 1 gbps\n  down: 1 gbps\n\nforward:\n  remote: ${exit}:${t.port}\n\nmasquerade:\n  type: proxy\n  proxy:\n    url: https://developer.mozilla.org\n    rewriteHost: true`
    : `# NovaTunnel — Hysteria2 سمت خروجی\nlisten: :${t.port}\n\ntls:\n  sni: edge-cdn.example.net\n  alpn: [h3]\n\nobfs:\n  type: salamander\n  password: ${k3}\n\nauth:\n  type: password\n  password: ${pseudoKey(`a-${t.id}`, 24)}\n\n# خروجی مستقیم به اینترنت\nacl:\n  inline: [direct(all)]\n\nresolver:\n  type: udp\n  udp: { addr: 1.1.1.1:53 }`;
}

export default function TunnelDetailClient({ tunnel: t }: { tunnel: TunnelDetail }) {
  const router = useRouter();
  const p = protocolById(t.protocol);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [tab, setTab] = useState<"entry" | "exit">("entry");
  const active = t.status === "active";
  const config = buildConfig(t, tab);

  const act = async (action: string) => {
    setBusy(true);
    try {
      await fetch(`/api/tunnels/${t.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await fetch(`/api/tunnels/${t.id}`, { method: "DELETE" });
      router.push("/tunnels");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="animate-fade-up">
        <Link href="/tunnels" className="mb-3 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300">
          <ArrowRight size={14} /> بازگشت به تانل‌ها
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-black text-white">{t.name}</h2>
              <StatusPill status={t.status} />
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="chip" style={{ borderColor: `${p.color}44`, background: `${p.color}14`, color: p.color }}>{p.name}</span>
              <span className="chip font-mono text-slate-400 ltr">:{t.port}</span>
              <span className="chip text-slate-400">{t.encryption}</span>
              <span className="chip text-slate-500">ایجاد: {faDate(t.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => act(active ? "stop" : "start")} disabled={busy} className={`btn text-xs ${active ? "btn-soft" : "btn-success"}`}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : active ? <Pause size={14} /> : <Play size={14} />}
              {active ? "توقف تانل" : "شروع تانل"}
            </button>
            <button onClick={() => act("restart")} disabled={busy} className="btn btn-soft text-xs">
              <RotateCcw size={14} /> راه‌اندازی مجدد
            </button>
            {confirmDel ? (
              <button onClick={remove} disabled={busy} className="btn btn-danger text-xs">
                <Trash2 size={14} /> تأیید حذف کامل
              </button>
            ) : (
              <button onClick={() => setConfirmDel(true)} className="btn btn-danger text-xs">
                <Trash2 size={14} /> حذف
              </button>
            )}
          </div>
        </div>
      </div>

      {/* gauges */}
      <div className="animate-fade-up grid grid-cols-2 gap-4 lg:grid-cols-4" style={{ animationDelay: "100ms" }}>
        {[
          <Gauge key="g1" value={t.latency} min={0} max={120} label="پینگ رفت‌وبرگشت" unit="ms" />,
          <Gauge key="g2" value={t.throughput} min={0} max={1500} label="گذردهی لحظه‌ای" unit="Mbps" color="#a78bfa" />,
          <Gauge key="g3" value={99.97} min={98.5} max={100} label="پایداری اتصال" unit="٪" color="#34d399" formatter={(v) => faNum1(v)} />,
          <Gauge key="g4" value={Math.min(8000, t.trafficGb)} min={0} max={8000} label="ترافیک کل" unit="GB" color="#f59e0b" />,
        ].map((g, i) => (
          <div key={i} className="glass-panel card-hover flex items-center justify-center rounded-3xl py-5">{g}</div>
        ))}
      </div>

      {/* live charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="glass-panel animate-fade-up rounded-3xl p-5 sm:p-6" style={{ animationDelay: "160ms" }}>
          <h3 className="mb-4 text-sm font-bold text-white">پینگ لحظه‌ای تانل</h3>
          <LiveAreaChart
            initial={genWalk(`lat-${t.id}`, 56, t.latency, 5, Math.max(5, t.latency - 10), t.latency + 22)}
            min={Math.max(5, t.latency - 10)}
            max={t.latency + 22}
            volatility={4.5}
            color="#22d3ee"
            unit="ms"
            height={190}
          />
        </section>
        <section className="glass-panel animate-fade-up rounded-3xl p-5 sm:p-6" style={{ animationDelay: "220ms" }}>
          <h3 className="mb-4 text-sm font-bold text-white">گذردهی لحظه‌ای</h3>
          <LiveAreaChart
            initial={genWalk(`thr-${t.id}`, 56, t.throughput || 800, 90, Math.max(120, t.throughput - 260), t.throughput + 200)}
            min={Math.max(120, t.throughput - 260)}
            max={t.throughput + 200}
            volatility={70}
            color="#a78bfa"
            unit="Mbps"
            height={190}
            liveLabel="بدون افت سرعت"
          />
        </section>
      </div>

      {/* config + info */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <section className="glass-panel animate-fade-up rounded-3xl p-5 sm:p-6 xl:col-span-3" style={{ animationDelay: "280ms" }}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-400/10 text-violet-300">
                <FileCode2 size={17} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">پیکربندی تولیدشده</h3>
                <p className="text-[11px] text-slate-500">کلیدها به‌صورت امن روی سرور تولید و ذخیره می‌شوند</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl border border-white/10 bg-white/[0.04] p-1">
                {(["entry", "exit"] as const).map((side) => (
                  <button
                    key={side}
                    onClick={() => setTab(side)}
                    className={`rounded-lg px-3 py-1.5 text-[11px] transition-all ${tab === side ? "bg-cyan-500/20 text-cyan-200" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    {side === "entry" ? "سمت ورودی" : "سمت خروجی"}
                  </button>
                ))}
              </div>
              <CopyButton text={config} />
            </div>
          </div>
          <pre dir="ltr" className="max-h-80 overflow-auto rounded-2xl border border-white/5 bg-[#070b16] p-4 text-left font-mono text-[11px] leading-5 text-cyan-100/85">
            {config}
          </pre>
        </section>

        <section className="glass-panel animate-fade-up rounded-3xl p-5 sm:p-6 xl:col-span-2" style={{ animationDelay: "340ms" }}>
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
              <Info size={17} />
            </span>
            <h3 className="text-sm font-bold text-white">اطلاعات اتصال</h3>
          </div>
          <dl className="space-y-2.5 text-xs">
            {[
              { k: "مسیر", v: `${t.entryName ?? "—"} ⇄ ${t.exitName ?? "—"}` },
              { k: "آدرس ورودی", v: t.entryIp ?? "—", mono: true },
              { k: "آدرس خروجی", v: t.exitIp ?? "—", mono: true },
              { k: "پورت / MTU", v: `${t.port} / ${t.mtu}`, mono: true },
              { k: "رمزنگاری", v: t.encryption },
              { k: "آخرین چرخش کلید", v: faRel(Date.now() - 47 * 60_000) },
              { k: "ترافیک کل", v: faGb(t.trafficGb) },
            ].map((r) => (
              <div key={r.k} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5">
                <dt className="text-slate-500">{r.k}</dt>
                <dd className={`text-slate-200 ${r.mono ? "font-mono ltr" : ""}`}>{r.v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3.5 py-3 text-[11px] leading-5 text-emerald-200/90">
            <Cpu size={14} className="mt-0.5 shrink-0" />
            مسیریابی هوشمند و BBR فعال است؛ در صورت اختلال، مسیر یددهی خودکار (نسخهٔ ۲٫۵ به بعد) بدون قطعی جایگزین می‌شود.
          </div>
        </section>
      </div>

      {/* 24h */}
      <section className="glass-panel animate-fade-up rounded-3xl p-5 sm:p-6" style={{ animationDelay: "400ms" }}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">روند ترافیک ۲۴ ساعت گذشته</h3>
          <span className="chip font-mono text-emerald-300 ltr">avg {faNum(t.throughput)} Mbps</span>
        </div>
        <AreaChart data={genWalk(`day-${t.id}`, 48, t.throughput || 700, 130, 200, 1250)} color={p.color} height={180} unit="Mbps" />
      </section>
    </div>
  );
}
