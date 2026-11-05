import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getPanelVersion } from "@/lib/seed";
import { listReleases } from "@/lib/data";
import { compareVersions } from "@/lib/version";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });

  // simulated GitHub API round-trip to `novatunnel/nova-core` releases
  await new Promise((r) => setTimeout(r, 800));

  const [current, all] = await Promise.all([getPanelVersion(), listReleases()]);
  const newer = all.filter((x) => compareVersions(x.version, current) > 0);

  return NextResponse.json({
    current,
    latest: all[0]?.version ?? current,
    available: newer.length,
    checkedAt: new Date().toISOString(),
  });
}
