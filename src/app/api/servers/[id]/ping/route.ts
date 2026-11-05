import { NextResponse } from "next/server";
import { db } from "@/db";
import { servers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { countryByName } from "@/lib/constants";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const { id } = await ctx.params;

  const rows = await db.select().from(servers).where(eq(servers.id, Number(id))).limit(1);
  const s = rows[0];
  if (!s) return NextResponse.json({ error: "سرور یافت نشد" }, { status: 404 });

  // simulate 4×ICMP echo and report RTT
  await new Promise((r) => setTimeout(r, 500));
  const hint = countryByName(s.country).pingHint;
  const latency = Math.max(3, hint + Math.round(Math.random() * 10) - 4);
  const load = 5 + Math.round(Math.random() * 75);

  const updated = await db
    .update(servers)
    .set({ latency, load, status: "online" })
    .where(eq(servers.id, s.id))
    .returning();
  return NextResponse.json(updated[0]);
}
