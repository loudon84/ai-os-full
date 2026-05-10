"use client";

import { SkillsTable } from "../components/skills/SkillsTable";
import { SkillsReloadButton } from "../components/skills/SkillsReloadButton";
import { HermesModuleShell } from "../components/layout/HermesModuleShell";

export default function HermesSkillsPage() {
  return (
    <HermesModuleShell
      title="Skills"
      description="Builtin, workspace and user-installed skills"
      actions={<SkillsReloadButton />}
    >
      <SkillsTable />
    </HermesModuleShell>
  );
}
