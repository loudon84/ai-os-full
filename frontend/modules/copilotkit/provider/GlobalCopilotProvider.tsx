"use client";

import { PropsWithChildren } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";
import { COPILOT_CONFIG } from "@/modules/copilotkit/lib/copilot-config";

type GlobalCopilotProviderProps = PropsWithChildren;

export function GlobalCopilotProvider({
  children,
}: GlobalCopilotProviderProps) {
  return (
    <CopilotKit runtimeUrl={COPILOT_CONFIG.runtimeUrl}>
      {children}
    </CopilotKit>
  );
}
