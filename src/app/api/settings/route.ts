import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getSessionUser } from "@/lib/session";
import { getSetting, setSetting, ensureSeed } from "@/lib/seed";

const ALLOWED = new Set(["admin_display_name", "auto_update_check", "maintenance_mode"]);

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  await ensureSeed();
  return NextResponse.json({
    displayName: await getSetting("admin_display_name", "مدیر ارشد"),
    apiToken: await getSetting("api_token", ""),
    autoUpdateCheck: (await getSetting("auto_update_check", "on")) === "on",
    maintenanceMode: (await getSetting("maintenance_mode", "off")) === "on",
  });
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const updates = (body?.updates ?? {}) as Record<string, unknown>;
  for (const [key, raw] of Object.entries(updates)) {
    if (!ALLOWED.has(key)) continue;
    const value = String(raw ?? "").slice(0, 200);
    await setSetting(key, value);
  }
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (body?.action === "regenerate_token") {
    const token = randomBytes(24).toString("hex");
    await setSetting("api_token", token);
    return NextResponse.json({ token });
  }
  return NextResponse.json({ error: "عملیات نامعتبر" }, { status: 400 });
}
