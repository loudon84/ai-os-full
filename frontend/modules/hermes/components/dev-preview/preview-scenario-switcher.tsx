"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHermesPreviewStore } from "../../stores/hermes-preview-store";
import { getScenariosByDomain } from "../../dev/preview-registry";

export function PreviewScenarioSwitcher() {
  const domain = useHermesPreviewStore((s) => s.domain);
  const scenarioKey = useHermesPreviewStore((s) => s.scenarioKey);
  const setScenarioKey = useHermesPreviewStore((s) => s.setScenarioKey);

  const scenarios = getScenariosByDomain(domain);

  return (
    <Select value={scenarioKey} onValueChange={setScenarioKey}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select scenario" />
      </SelectTrigger>
      <SelectContent>
        {scenarios.map((s) => (
          <SelectItem key={s.key} value={s.key}>
            {s.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
