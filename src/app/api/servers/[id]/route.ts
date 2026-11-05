import { NextResponse } from "next/server";
import { db } from "@/db";
import { servers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (!["online", "offline", "degraded"].includes(status)) {
    return NextResponse.json({ error: "وضعیت نامعتبر است" }, { status: 400 });
  }
  const updated = await db.update(servers).set({ status }).where(eq(servers.id, Number(id))).returning();
  if (!updated[0]) return NextResponse.json({ error: "سرور یافت نشد" }, { status: 404 });
  return NextResponse.json(updated[0]);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const { id } = await ctx.params;
  await db.delete(servers).where(eq(servers.id, Number(id)));
  return NextResponse.json({ ok: true });
}
