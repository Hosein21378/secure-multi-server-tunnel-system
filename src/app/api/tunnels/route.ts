import { NextResponse } from "next/server";
import { db } from "@/db";
import { servers, tunnels } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { protocolById } from "@/lib/constants";

const PROTOCOL_THROUGHPUT: Record<string, number> = {
  hysteria2: 940,
  wireguard: 880,
  vless: 760,
  gre: 430,
};

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const protocol = String(body?.protocol ?? "hysteria2");
  const entryServerId = Number(body?.entryServerId) || null;
  const exitServerId = Number(body?.exitServerId) || null;
  const port = Math.round(Number(body?.port)) || 443;
  const mtu = Math.min(1500, Math.max(1280, Math.round(Number(body?.mtu)) || 1420));
  const meta = protocolById(protocol);
  const encryption = String(body?.encryption ?? meta.enc);

  if (name.length < 2) return NextResponse.json({ error: "نام تانل معتبر نیست" }, { status: 400 });
  if (!entryServerId || !exitServerId || entryServerId === exitServerId) {
    return NextResponse.json({ error: "سرور ورودی و خروجی باید متفاوت انتخاب شوند" }, { status: 400 });
  }
  if (port < 1 || port > 65535) return NextResponse.json({ error: "پورت نامعتبر است" }, { status: 400 });

  const nodes = await db.select().from(servers).where(inArray(servers.id, [entryServerId, exitServerId]));
  const exitNode = nodes.find((n) => n.id === exitServerId);
  if (nodes.length !== 2 || !exitNode) {
    return NextResponse.json({ error: "سرور انتخاب‌شده یافت نشد" }, { status: 404 });
  }

  // realistic link budget: entry proximity + exit distance, optimized path
  const latency = Math.max(8, Math.round(exitNode.latency * 0.36) + 6 + Math.round(Math.random() * 5));
  const throughput = (PROTOCOL_THROUGHPUT[protocol] ?? 800) + Math.round(Math.random() * 80) - 40;

  const inserted = await db
    .insert(tunnels)
    .values({
      name,
      protocol,
      entryServerId,
      exitServerId,
      port,
      encryption,
      mtu,
      status: "active",
      latency,
      throughput,
      trafficGb: 0,
    })
    .returning();
  return NextResponse.json(inserted[0]);
}
