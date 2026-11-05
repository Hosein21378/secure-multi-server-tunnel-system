import { db } from "@/db";
import { users, servers, tunnels, releases, settings } from "@/db/schema";
import { hashPassword } from "@/lib/session";
import { compareVersions } from "@/lib/version";
import { randomBytes } from "node:crypto";
import { eq, sql } from "drizzle-orm";

export { compareVersions };

export const CORE_VERSION_DEFAULT = "2.3.9";

export type FakeRelease = {
  version: string;
  title: string;
  notes: string[];
  sizeMb: number;
  daysAgo: number;
};

/** Simulated GitHub releases feed for nova-core */
export const FAKE_RELEASES: FakeRelease[] = [
  {
    version: "2.4.0",
    title: "موتور زمان‌بندی بسته‌ها (Packet Scheduler)",
    notes: [
      "کاهش ۱۸٪ تأخر در Hysteria 2 با زمان‌بندی مجدد بسته‌های UDP",
      "رفع نشت حافظه در multiplexor اتصالات هم‌زمان",
      "بهبود دقت نمودارهای پینگ لحظه‌ای پنل",
      "به‌روزرسانی کتابخانهٔ رمزنگاری به libsodium 1.0.20",
    ],
    sizeMb: 17.2,
    daysAgo: 12,
  },
  {
    version: "2.5.0",
    title: "مسیر یددهی خودکار (Multi-Path Failover)",
    notes: [
      "اتصال هم‌زمان به دو سرور خروجی و سوییچ بدون قطعی زیر ۱۲۰ms",
      "API نسخهٔ ۲ پنل با احراز توکن Bearer",
      "سخت‌سازی handshake پروتکل Reality در برابر fingerprinting",
      "نمایش مصرف CPU/RAM هر سرور در پنل",
    ],
    sizeMb: 18.4,
    daysAgo: 6,
  },
  {
    version: "2.5.1",
    title: "پچ امنیتی و چرخش کلید",
    notes: [
      "رفع ضعف احتمالی در چرخش کلید WireGuard (توصیه به نصب فوری)",
      "بهبود اعتبارسنجی امضای بسته‌های آپدیت",
      "رفع خطای محاسبهٔ ترافیک در بازه‌های ۳۰ روزه",
    ],
    sizeMb: 18.6,
    daysAgo: 3,
  },
  {
    version: "2.5.2",
    title: "پایداری، مانیتورینگ و آپدیت بدون قطعی",
    notes: [
      "متریک‌های Prometheus روی مسیر ‎/metrics",
      "کاهش ۲۲٪ مصرف CPU در تانل‌های پرترافیک",
      "مهاجرت زندهٔ اتصالات هنگام آپدیت — Zero-Downtime Update",
      "بهبود لاگ‌نویسی ساختاری با قالب JSON",
    ],
    sizeMb: 18.9,
    daysAgo: 1,
  },
];

async function tableCount(table: "users" | "servers" | "tunnels"): Promise<number> {
  const t = table === "users" ? users : table === "servers" ? servers : tunnels;
  const rows = await db.select({ c: sql<number>`count(*)::int` }).from(t);
  return rows[0]?.c ?? 0;
}

async function seedInner() {
  // default admin
  if ((await tableCount("users")) === 0) {
    await db
      .insert(users)
      .values({ username: "admin", passwordHash: hashPassword("admin123"), displayName: "مدیر ارشد" })
      .onConflictDoNothing();
  }

  // servers
  if ((await tableCount("servers")) === 0) {
    await db.insert(servers).values([
      { name: "هسته تهران", country: "ایران", countryCode: "IR", city: "تهران", ip: "185.143.72.14", role: "entry", status: "online", latency: 7, load: 34, agentVersion: "2.3.9" },
      { name: "هسته شیراز", country: "ایران", countryCode: "IR", city: "شیراز", ip: "185.143.73.22", role: "entry", status: "online", latency: 9, load: 18, agentVersion: "2.3.9" },
      { name: "لبه فرانکفورت", country: "آلمان", countryCode: "DE", city: "فرانکفورت", ip: "45.132.19.8", role: "exit", status: "online", latency: 58, load: 41, agentVersion: "2.3.9" },
      { name: "لبه آمستردام", country: "هلند", countryCode: "NL", city: "آمستردام", ip: "45.86.211.44", role: "exit", status: "online", latency: 62, load: 22, agentVersion: "2.3.9" },
      { name: "لبه استانبول", country: "ترکیه", countryCode: "TR", city: "استانبول", ip: "78.135.90.7", role: "exit", status: "online", latency: 41, load: 12, agentVersion: "2.3.9" },
      { name: "لبه لندن", country: "انگلستان", countryCode: "GB", city: "لندن", ip: "146.70.61.90", role: "exit", status: "degraded", latency: 74, load: 68, agentVersion: "2.3.8" },
    ]);
  }

  // tunnels (reference servers by name)
  if ((await tableCount("tunnels")) === 0) {
    const all = await db.select().from(servers);
    const byName = (n: string) => all.find((s) => s.name === n)?.id ?? null;
    const tehran = byName("هسته تهران");
    const shiraz = byName("هسته شیراز");
    await db.insert(tunnels).values([
      { name: "تانل اصلی — تهران ⇄ فرانکفورت", protocol: "hysteria2", entryServerId: tehran, exitServerId: byName("لبه فرانکفورت"), port: 443, encryption: "TLS 1.3 / AES-256-GCM", mtu: 1420, status: "active", latency: 24, throughput: 940, trafficGb: 4821.6 },
      { name: "تانل پشتیبان — تهران ⇄ آمستردام", protocol: "wireguard", entryServerId: tehran, exitServerId: byName("لبه آمستردام"), port: 51820, encryption: "ChaCha20-Poly1305", mtu: 1420, status: "active", latency: 31, throughput: 862, trafficGb: 2913.2 },
      { name: "استریم زنده — تهران ⇄ استانبول", protocol: "vless", entryServerId: tehran, exitServerId: byName("لبه استانبول"), port: 443, encryption: "Reality / X25519", mtu: 1500, status: "active", latency: 19, throughput: 1124, trafficGb: 6248.9 },
      { name: "گیمینگ — تهران ⇄ فرانکفورت", protocol: "hysteria2", entryServerId: tehran, exitServerId: byName("لبه فرانکفورت"), port: 8443, encryption: "TLS 1.3 / AES-256-GCM", mtu: 1280, status: "active", latency: 21, throughput: 645, trafficGb: 1830.4 },
      { name: "خط سازمانی — شیراز ⇄ لندن", protocol: "gre", entryServerId: shiraz, exitServerId: byName("لبه لندن"), port: 47, encryption: "AES-256 / SHA-384", mtu: 1476, status: "paused", latency: 38, throughput: 0, trafficGb: 512.7 },
    ]);
  }

  // releases feed
  for (let i = FAKE_RELEASES.length - 1; i >= 0; i--) {
    const r = FAKE_RELEASES[i];
    const publishedAt = new Date(Date.now() - r.daysAgo * 86400_000);
    await db
      .insert(releases)
      .values({ version: r.version, title: r.title, notes: r.notes.join("\n"), sizeMb: Math.round(r.sizeMb), publishedAt })
      .onConflictDoNothing();
  }

  // settings
  const defaults: Record<string, string> = {
    panel_version: CORE_VERSION_DEFAULT,
    api_token: randomBytes(24).toString("hex"),
    auto_update_check: "on",
    maintenance_mode: "off",
    admin_display_name: "مدیر ارشد",
  };
  for (const [key, value] of Object.entries(defaults)) {
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoNothing();
  }
}

export async function ensureSeed(): Promise<void> {
  const g = globalThis as unknown as { __novaSeeded?: Promise<void> };
  if (!g.__novaSeeded) {
    g.__novaSeeded = seedInner().catch((e) => {
      g.__novaSeeded = undefined;
      throw e;
    });
  }
  return g.__novaSeeded;
}

export async function getSetting(key: string, fallback = ""): Promise<string> {
  const rows = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return rows[0]?.value ?? fallback;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}

export async function getPanelVersion(): Promise<string> {
  return getSetting("panel_version", CORE_VERSION_DEFAULT);
}
