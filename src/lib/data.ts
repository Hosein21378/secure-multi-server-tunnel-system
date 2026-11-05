import { db } from "@/db";
import { servers, tunnels, releases, updateJobs } from "@/db/schema";
import type { ServerRow, TunnelRow, ReleaseRow, UpdateJobRow } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { ensureSeed, compareVersions } from "@/lib/seed";

export type EnrichedTunnel = TunnelRow & {
  entry: ServerRow | null;
  exit: ServerRow | null;
};

export async function listServers(): Promise<ServerRow[]> {
  await ensureSeed();
  return db.select().from(servers).orderBy(asc(servers.id));
}

export async function listTunnels(): Promise<EnrichedTunnel[]> {
  await ensureSeed();
  const [ts, ss] = await Promise.all([
    db.select().from(tunnels).orderBy(asc(tunnels.id)),
    db.select().from(servers),
  ]);
  return ts.map((t) => ({
    ...t,
    entry: ss.find((s) => s.id === t.entryServerId) ?? null,
    exit: ss.find((s) => s.id === t.exitServerId) ?? null,
  }));
}

export async function getTunnel(id: number): Promise<EnrichedTunnel | null> {
  await ensureSeed();
  const rows = await db.select().from(tunnels).where(eq(tunnels.id, id)).limit(1);
  if (!rows[0]) return null;
  const ss = await db.select().from(servers);
  const t = rows[0];
  return {
    ...t,
    entry: ss.find((s) => s.id === t.entryServerId) ?? null,
    exit: ss.find((s) => s.id === t.exitServerId) ?? null,
  };
}

export async function listReleases(): Promise<ReleaseRow[]> {
  await ensureSeed();
  const rows = await db.select().from(releases);
  return rows.sort((a, b) => compareVersions(b.version, a.version));
}

export async function listJobs(limit = 8): Promise<UpdateJobRow[]> {
  await ensureSeed();
  return db.select().from(updateJobs).orderBy(desc(updateJobs.id)).limit(limit);
}
