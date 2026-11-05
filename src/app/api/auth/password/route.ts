import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser, verifyPassword, hashPassword } from "@/lib/session";

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const current = String(body?.current ?? "");
  const next = String(body?.next ?? "");
  if (next.length < 6) {
    return NextResponse.json({ error: "رمز عبور جدید باید حداقل ۶ کاراکتر باشد" }, { status: 400 });
  }
  const rows = await db.select().from(users).where(eq(users.username, session.username)).limit(1);
  const user = rows[0];
  if (!user || !verifyPassword(current, user.passwordHash)) {
    return NextResponse.json({ error: "رمز عبور فعلی اشتباه است" }, { status: 400 });
  }
  await db.update(users).set({ passwordHash: hashPassword(next) }).where(eq(users.id, user.id));
  return NextResponse.json({ ok: true });
}
