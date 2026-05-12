"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PREVIEW_DOMAIN_GROUPS } from "@/modules/hermes/dev/preview-groups";
import { getScenariosByDomain } from "@/modules/hermes/dev/preview-registry";

export default function HermesToolUiDevPage() {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {PREVIEW_DOMAIN_GROUPS.map((group) => {
        const scenarioCount = getScenariosByDomain(group.domain).length;
        return (
          <Card
            key={group.domain}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => router.push(`/hermes/dev/tool-ui/${group.domain}`)}
          >
            <CardHeader>
              <CardTitle>{group.label}</CardTitle>
              <CardDescription>{group.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-sm text-muted-foreground">
                {scenarioCount} scenarios
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

