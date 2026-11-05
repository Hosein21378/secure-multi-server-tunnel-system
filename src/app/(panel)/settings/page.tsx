import { getSetting } from "@/lib/seed";
import { getSessionUser } from "@/lib/session";
import SettingsClient from "@/components/SettingsClient";

export default async function SettingsPage() {
  const [displayName, apiToken, autoCheck, maintenance] = await Promise.all([
    getSetting("admin_display_name", "مدیر ارشد"),
    getSetting("api_token", ""),
    getSetting("auto_update_check", "on"),
    getSetting("maintenance_mode", "off"),
  ]);
  const session = await getSessionUser();

  return (
    <SettingsClient
      displayName={displayName}
      apiToken={apiToken}
      autoCheck={autoCheck === "on"}
      maintenance={maintenance === "on"}
      username={session?.username ?? "admin"}
    />
  );
}
