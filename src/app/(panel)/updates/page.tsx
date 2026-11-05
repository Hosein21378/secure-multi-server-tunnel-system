import { listReleases, listJobs } from "@/lib/data";
import { getPanelVersion } from "@/lib/seed";
import UpdatesClient from "@/components/UpdatesClient";

export default async function UpdatesPage() {
  const [current, releases, jobs] = await Promise.all([getPanelVersion(), listReleases(), listJobs()]);

  return (
    <UpdatesClient
      current={current}
      releases={releases.map((r) => ({
        id: r.id,
        version: r.version,
        title: r.title,
        notes: r.notes.split("\n").filter(Boolean),
        sizeMb: r.sizeMb,
        publishedAt: r.publishedAt.toISOString(),
      }))}
      jobs={jobs.map((j) => ({
        id: j.id,
        version: j.version,
        status: j.status,
        progress: j.progress,
        log: j.log,
        startedAt: j.startedAt.toISOString(),
        finishedAt: j.finishedAt ? j.finishedAt.toISOString() : null,
      }))}
    />
  );
}
