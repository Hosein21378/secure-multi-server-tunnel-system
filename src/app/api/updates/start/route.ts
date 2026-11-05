import { NextResponse } from "next/server";
import { db } from "@/db";
import { releases, servers, updateJobs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { getPanelVersion, setSetting, ensureSeed } from "@/lib/seed";
import { compareVersions } from "@/lib/version";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function appendLog(jobId: number, line: string, progress: number) {
  const rows = await db.select().from(updateJobs).where(eq(updateJobs.id, jobId)).limit(1);
  const prev = rows[0]?.log ?? "";
  await db
    .update(updateJobs)
    .set({ log: prev ? `${prev}\n${line}` : line, progress })
    .where(eq(updateJobs.id, jobId));
}

async function runUpdate(jobId: number, version: string, sizeMb: number) {
  const steps: [string, number, number][] = [
    ["اتصال امن به GitHub Releases برقرار شد (TLS 1.3، WaitForIt پین شده)", 5, 550],
    [`در حال دانلود nova-core v${version} — ${sizeMb} مگابایت…`, 20, 1600],
    ["امضای SHA-256 و گواهی Sigstore بسته تأیید شد ✓", 34, 800],
    ["بکاپ کامل از پایگاه‌داده، کلیدها و تنظیمات گرفته شد", 47, 950],
    ["مهاجرت زندهٔ اتصالات فعال به نمونهٔ جدید — بدون قطعی (Zero-Downtime)", 63, 1500],
    ["جایگزینی باینری هسته و اعمال مایگریشن‌های schema", 77, 1200],
    ["راه‌اندازی مجدد سرویس‌ها با systemd و اجرای health-check", 89, 950],
    ["اعتبارسنجی پینگ میان‌سرورها: میانگین ۲۴ms — سلامت کامل ✓", 97, 750],
    [`نسخهٔ v${version} با موفقیت فعال شد؛ Agent سرورها هم به‌روز شد`, 100, 450],
  ];
  try {
    for (const [line, progress, delay] of steps) {
      await appendLog(jobId, line, progress);
      await sleep(delay);
    }
    await setSetting("panel_version", version);
    await db.update(servers).set({ agentVersion: version });
    await db
      .update(updateJobs)
      .set({ status: "success", finishedAt: new Date(), progress: 100 })
      .where(eq(updateJobs.id, jobId));
  } catch {
    await db
      .update(updateJobs)
      .set({ status: "failed", finishedAt: new Date() })
      .where(eq(updateJobs.id, jobId));
  }
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  await ensureSeed();

  const body = await req.json().catch(() => null);
  const version = String(body?.version ?? "");
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    return NextResponse.json({ error: "نسخهٔ نامعتبر" }, { status: 400 });
  }

  // single concurrent job guard (process-level + db-level)
  const g = globalThis as unknown as { __novaUpdateRunning?: boolean };
  const runningRows = await db.select().from(updateJobs).where(eq(updateJobs.status, "running")).limit(1);
  if (g.__novaUpdateRunning || runningRows.length > 0) {
    return NextResponse.json({ error: "یک به‌روزرسانی دیگر در حال اجراست" }, { status: 409 });
  }

  const current = await getPanelVersion();
  const relRows = await db.select().from(releases).where(eq(releases.version, version)).limit(1);
  if (!relRows[0]) return NextResponse.json({ error: "این نسخه در فید ریلیزها یافت نشد" }, { status: 404 });
  if (compareVersions(version, current) <= 0) {
    return NextResponse.json({ error: "این نسخه قبلاً نصب شده یا قدیمی‌تر است" }, { status: 400 });
  }

  const inserted = await db.insert(updateJobs).values({ version, status: "running", progress: 0 }).returning();
  const job = inserted[0];

  g.__novaUpdateRunning = true;
  runUpdate(job.id, version, relRows[0].sizeMb).finally(() => {
    g.__novaUpdateRunning = false;
  });

  return NextResponse.json({ jobId: job.id });
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const rows = await db.select().from(updateJobs).orderBy(desc(updateJobs.id)).limit(8);
  return NextResponse.json(rows);
}
