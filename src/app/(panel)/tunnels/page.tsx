import { listServers, listTunnels } from "@/lib/data";
import TunnelsManager from "@/components/TunnelsManager";

export default async function TunnelsPage() {
  const [tunnels, servers] = await Promise.all([listTunnels(), listServers()]);

  const liteServers = servers.map((s) => ({
    id: s.id,
    name: s.name,
    city: s.city,
    country: s.country,
    ip: s.ip,
    role: s.role,
    status: s.status,
    latency: s.latency,
  }));

  const liteTunnels = tunnels.map((t) => ({
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
    entry: t.entry ? { id: t.entry.id, name: t.entry.name, city: t.entry.city, country: t.entry.country, ip: t.entry.ip, role: t.entry.role, status: t.entry.status, latency: t.entry.latency } : null,
    exit: t.exit ? { id: t.exit.id, name: t.exit.name, city: t.exit.city, country: t.exit.country, ip: t.exit.ip, role: t.exit.role, status: t.exit.status, latency: t.exit.latency } : null,
  }));

  return <TunnelsManager tunnels={liteTunnels} servers={liteServers} />;
}
