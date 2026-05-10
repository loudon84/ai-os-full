"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PREVIEW_DOMAIN_GROUPS } from "../../dev/preview-groups";
import { getScenariosByDomain } from "../../dev/preview-registry";
import { useHermesPreviewStore } from "../../stores/hermes-preview-store";
import { PreviewDomainFilter } from "./preview-domain-filter";
import { PreviewScenarioSwitcher } from "./preview-scenario-switcher";

export function PreviewSidebar() {
  const domain = useHermesPreviewStore((s) => s.domain);
  const scenarioKey = useHermesPreviewStore((s) => s.scenarioKey);
  const setScenarioKey = useHermesPreviewStore((s) => s.setScenarioKey);

  return (
    <div className="flex h-full flex-col">
      {/* Domain filter */}
      <div className="p-3">
        <PreviewDomainFilter />
      </div>

      <Separator />

      {/* Scenario list grouped by domain */}
      <ScrollArea className="flex-1 px-3 py-2">
        {PREVIEW_DOMAIN_GROUPS.map((group) => {
          const scenarios = getScenariosByDomain(group.domain);
          return (
            <div key={group.domain} className="mb-3">
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                {group.label}
              </div>
              <div className="flex flex-col gap-1">
                {scenarios.map((s) => (
                  <button
                    key={s.key}
                    className={`flex items-center justify-between gap-1 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted ${
                      scenarioKey === s.key
                        ? "bg-primary/10 font-semibold"
                        : ""
                    }`}
                    onClick={() => setScenarioKey(s.key)}
                  >
                    <span className="truncate">{s.title}</span>
                    {s.fixtureFile ? (
                      <Badge variant="outline" className="shrink-0 border-green-500 text-[10px] text-green-600">
                        Fixture
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0 text-[10px] text-muted-foreground">
                        No Fixture
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </ScrollArea>

      <Separator />

      {/* Quick scenario switcher */}
      <div className="p-3">
        <div className="mb-1 text-xs font-medium text-muted-foreground">
          Quick Switch
        </div>
        <PreviewScenarioSwitcher />
      </div>
    </div>
  );
}
