import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import PanelShell from "@/components/PanelShell";
import BackgroundFX from "@/components/BackgroundFX";
import { getSessionUser } from "@/lib/session";
import { ensureSeed, getPanelVersion, getSetting } from "@/lib/seed";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  await ensureSeed();
  const version = await getPanelVersion();
  const displayName = await getSetting("admin_display_name", "مدیر ارشد");

  return (
    <>
      <BackgroundFX />
      <PanelShell userName={displayName} version={version}>
        {children}
      </PanelShell>
    </>
  );
}
