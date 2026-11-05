import { listServers } from "@/lib/data";
import { getSetting } from "@/lib/seed";
import ServersManager from "@/components/ServersManager";

export default async function ServersPage() {
  const [servers, token] = await Promise.all([listServers(), getSetting("api_token", "")]);

  const lite = servers.map((s) => ({
    id: s.id,
    name: s.name,
    country: s.country,
    countryCode: s.countryCode,
    city: s.city,
    ip: s.ip,
    role: s.role,
    status: s.status,
    latency: s.latency,
    load: s.load,
    agentVersion: s.agentVersion,
  }));

  const installCmd = `curl -fsSL https://get.novatunnel.dev | sudo bash -s -- --token ${token} --hub https://panel.novatunnel.dev`;

  return <ServersManager servers={lite} installCmd={installCmd} />;
}
