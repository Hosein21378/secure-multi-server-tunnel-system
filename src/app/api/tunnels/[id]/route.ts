import { NextResponse } from "next/server";
import { db } from "@/db";
import { tunnels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const patch: Partial<{ status: "active" | "paused" | "error"; name: string }> = {};
  if (["active", "paused", "error"].includes(body?.status)) patch.status = body.status;
  if (typeof body?.name === "string" && body.name.trim().length >= 2) patch.name = body.name.trim();
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "چیزی برای به‌روزرسانی نیست" }, { status: 400 });
  const updated = await db.update(tunnels).set(patch).where(eq(tunnels.id, Number(id))).returning();
  if (!updated[0]) return NextResponse.json({ error: "تانل یافت نشد" }, { status: 404 });
  return NextResponse.json(updated[0]);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const { id } = await ctx.params;
  await db.delete(tunnels).where(eq(tunnels.id, Number(id)));
  return NextResponse.json({ ok: true });
}
