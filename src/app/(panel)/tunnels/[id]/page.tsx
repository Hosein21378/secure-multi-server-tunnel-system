import { notFound } from "next/navigation";
import { getTunnel } from "@/lib/data";
import TunnelDetailClient from "@/components/TunnelDetailClient";

export default async function TunnelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTunnel(Number(id));
  if (!t) notFound();

  return (
    <TunnelDetailClient
      tunnel={{
        id: t.id,
        name: t.name,
        protocol: t.protocol,
        port: t.port,
        encryption: t.encryption,
        mtu: t.mtu,
        status: t.status,
        latency: t.latency,
        throughput: t.throughput,
        trafficGb: t.trafficGb,
        createdAt: t.createdAt.toISOString(),
        entryIp: t.entry?.ip ?? null,
        entryName: t.entry?.name ?? null,
        entryCity: t.entry?.city ?? null,
        exitIp: t.exit?.ip ?? null,
        exitName: t.exit?.name ?? null,
        exitCity: t.exit?.city ?? null,
      }}
    />
  );
}
