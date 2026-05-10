"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PREVIEW_DOMAIN_GROUPS } from "../../dev/preview-groups";
import { useHermesPreviewStore } from "../../stores/hermes-preview-store";

export function PreviewDomainFilter() {
  const domain = useHermesPreviewStore((s) => s.domain);
  const setDomain = useHermesPreviewStore((s) => s.setDomain);

  const currentValue = domain;

  return (
    <Tabs
      value={currentValue}
      onValueChange={(value) => {
        if (value !== "all") {
          setDomain(value as typeof domain);
        }
      }}
    >
      <TabsList className="w-full">
        <TabsTrigger value="all" className="text-xs">
          All
        </TabsTrigger>
        {PREVIEW_DOMAIN_GROUPS.map((group) => (
          <TabsTrigger key={group.domain} value={group.domain} className="text-xs">
            {group.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
