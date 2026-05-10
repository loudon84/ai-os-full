"use client";

import { SessionsTable } from "../components/sessions/SessionsTable";
import { HermesModuleShell } from "../components/layout/HermesModuleShell";

export default function HermesSessionsPage() {
  return (
    <HermesModuleShell title="Sessions" description="Conversation history and recent runtime traces">
      <SessionsTable />
    </HermesModuleShell>
  );
}
