import { NextResponse } from "next/server";
import { db } from "@/db";
import { servers } from "@/db/schema";
import { asc } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { ensureSeed, getPanelVersion } from "@/lib/seed";
import { countryByName } from "@/lib/constants";

async function auth() {
  return (await getSessionUser()) !== null;
}

export async function GET() {
  if (!(await auth())) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  await ensureSeed();
  const rows = await db.select().from(servers).orderBy(asc(servers.id));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  if (!(await auth())) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const country = String(body?.country ?? "").trim();
  const city = String(body?.city ?? "").trim();
  const ip = String(body?.ip ?? "").trim();
  const role = ["entry", "relay", "exit"].includes(body?.role) ? body.role : "exit";

  if (name.length < 2) return NextResponse.json({ error: "نام سرور معتبر نیست" }, { status: 400 });
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return NextResponse.json({ error: "آی‌پی معتبر نیست" }, { status: 400 });
  if (!city) return NextResponse.json({ error: "شهر را وارد کنید" }, { status: 400 });

  const c = countryByName(country);
  const latency = Math.max(3, c.pingHint + Math.round(Math.random() * 8) - 4);
  const load = 6 + Math.round(Math.random() * 24);
  const version = await getPanelVersion();

  const inserted = await db
    .insert(servers)
    .values({ name, country: c.name, countryCode: c.code, city, ip, role, status: "online", latency, load, agentVersion: version })
    .returning();
  return NextResponse.json(inserted[0]);
}
