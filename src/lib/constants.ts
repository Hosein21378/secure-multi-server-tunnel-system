export const PRODUCT = {
  name: "NovaTunnel",
  faName: "نواتانل",
  tagline: "تانل امن چند‌سروره با پینگ فوق‌پایین، بدون افت سرعت و کیفیت",
  repo: "github.com/novatunnel/nova-core",
  repoUrl: "https://github.com/novatunnel/nova-core",
};

export type ProtocolId = "hysteria2" | "wireguard" | "vless" | "gre";

export type ProtocolMeta = {
  id: ProtocolId;
  name: string;
  desc: string;
  port: number;
  enc: string;
  color: string;
  latencyLabel: string;
};

export const PROTOCOLS: ProtocolMeta[] = [
  {
    id: "hysteria2",
    name: "Hysteria 2",
    desc: "کمترین تأخر روی UDP با کنترل ازدحام Brutal — ایده‌آل برای استریم زنده و بازی",
    port: 443,
    enc: "TLS 1.3 / AES-256-GCM",
    color: "#22d3ee",
    latencyLabel: "~۱۸ms",
  },
  {
    id: "wireguard",
    name: "WireGuard",
    desc: "تانل در هستهٔ سیستم‌عامل؛ پایدار، سبک و با بالاترین گذردهی",
    port: 51820,
    enc: "ChaCha20-Poly1305",
    color: "#34d399",
    latencyLabel: "~۲۲ms",
  },
  {
    id: "vless",
    name: "VLESS + Reality",
    desc: "عبور نامرئی از فیلترینگ با احراز Reality، بدون نیاز به دامنه و سرتیفیکیت",
    port: 443,
    enc: "Reality / X25519",
    color: "#a78bfa",
    latencyLabel: "~۲۴ms",
  },
  {
    id: "gre",
    name: "GRE / IPsec",
    desc: "اتصال سایت‌به‌سایت لایه ۳ برای زیرساخت‌های سازمانی و روتینگ کامل",
    port: 47,
    enc: "AES-256 / SHA-384",
    color: "#f59e0b",
    latencyLabel: "~۳۵ms",
  },
];

export function protocolById(id: string): ProtocolMeta {
  return PROTOCOLS.find((p) => p.id === id) ?? PROTOCOLS[0];
}

export const COUNTRIES: { name: string; code: string; pingHint: number }[] = [
  { name: "ایران", code: "IR", pingHint: 7 },
  { name: "آلمان", code: "DE", pingHint: 58 },
  { name: "هلند", code: "NL", pingHint: 62 },
  { name: "ترکیه", code: "TR", pingHint: 38 },
  { name: "انگلستان", code: "GB", pingHint: 74 },
  { name: "فرانسه", code: "FR", pingHint: 66 },
  { name: "امارات", code: "AE", pingHint: 24 },
  { name: "فنلاند", code: "FI", pingHint: 81 },
  { name: "اتریش", code: "AT", pingHint: 63 },
];

export function countryByName(name: string) {
  return COUNTRIES.find((c) => c.name === name) ?? COUNTRIES[0];
}

export const ROLE_FA: Record<string, string> = {
  entry: "سرور ورودی (داخل)",
  relay: "سرور میانی",
  exit: "سرور خروجی (خارج)",
};

export const STATUS_FA: Record<string, string> = {
  online: "آنلاین",
  offline: "آفلاین",
  degraded: "اضطرار",
  active: "فعال",
  paused: "متوقف",
  error: "خطا",
  running: "در حال اجرا",
  success: "موفق",
  failed: "ناموفق",
};
