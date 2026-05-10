"use client";

import { GatewayHealthCard } from "../components/settings/GatewayHealthCard";
import { ModelsTable } from "../components/settings/ModelsTable";
import { HermesModuleShell } from "../components/layout/HermesModuleShell";

export default function HermesSettingsPage() {
  return (
    <HermesModuleShell title="Settings" description="Readonly runtime configuration summary">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <GatewayHealthCard />
        <ModelsTable />
      </div>
    </HermesModuleShell>
  );
}
