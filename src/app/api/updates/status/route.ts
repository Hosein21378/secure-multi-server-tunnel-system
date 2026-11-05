import { NextResponse } from "next/server";
import { db } from "@/db";
import { updateJobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });

  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isFinite(id)) return NextResponse.json({ error: "شناسه نامعتبر" }, { status: 400 });

  const rows = await db.select().from(updateJobs).where(eq(updateJobs.id, id)).limit(1);
  if (!rows[0]) return NextResponse.json({ error: "کار یافت نشد" }, { status: 404 });
  return NextResponse.json(rows[0]);
}
