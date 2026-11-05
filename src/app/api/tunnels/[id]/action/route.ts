import { NextResponse } from "next/server";
import { db } from "@/db";
import { tunnels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const action = String(body?.action ?? "");

  const rows = await db.select().from(tunnels).where(eq(tunnels.id, Number(id))).limit(1);
  const t = rows[0];
  if (!t) return NextResponse.json({ error: "تانل یافت نشد" }, { status: 404 });

  // In production this shells out to the Nova agent (systemctl / wg / hysteria).
  // Here we simulate state transitions with realistic jitter.
  await new Promise((r) => setTimeout(r, action === "restart" ? 900 : 400));

  let patch: Partial<typeof tunnels.$inferInsert> = {};
  if (action === "stop") {
    patch = { status: "paused", throughput: 0 };
  } else if (action === "start" || action === "restart") {
    patch = {
      status: "active",
      latency: Math.max(8, t.latency + Math.round(Math.random() * 6) - 3),
      throughput: t.throughput === 0 ? 700 + Math.round(Math.random() * 250) : t.throughput,
    };
  } else {
    return NextResponse.json({ error: "عملیات نامعتبر است" }, { status: 400 });
  }

  const updated = await db.update(tunnels).set(patch).where(eq(tunnels.id, t.id)).returning();
  return NextResponse.json(updated[0]);
}
