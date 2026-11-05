import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureSeed } from "@/lib/seed";
import { verifyPassword, createSessionToken, SESSION_COOKIE } from "@/lib/session";

export async function POST(req: Request) {
  try {
    await ensureSeed();
    const body = await req.json().catch(() => null);
    const username = String(body?.username ?? "").trim();
    const password = String(body?.password ?? "");
    if (!username || !password) {
      return NextResponse.json({ error: "نام کاربری و رمز عبور را وارد کنید" }, { status: 400 });
    }
    const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
    const user = rows[0];
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "نام کاربری یا رمز عبور اشتباه است" }, { status: 401 });
    }
    const { token, maxAge } = createSessionToken(user.username);
    const res = NextResponse.json({ ok: true, displayName: user.displayName });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "خطای داخلی سرور" }, { status: 500 });
  }
}
