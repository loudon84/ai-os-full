"use client";

import { useMemo } from "react";
import type { PageCopilotContext } from "@/modules/copilotkit/lib/copilot-types";

type UsePageCopilotContextInput = {
  pageId: string;
  pageTitle: string;
  route: string;
  module: string;
  summary?: string;
  selection?: PageCopilotContext["selection"];
  actions?: PageCopilotContext["actions"];
};

export function usePageCopilotContext(
  input: UsePageCopilotContextInput
): PageCopilotContext {
  return useMemo(
    () => ({
      pageId: input.pageId,
      pageTitle: input.pageTitle,
      route: input.route,
      module: input.module,
      summary: input.summary,
      selection: input.selection ?? {
        type: "none",
        payload: null,
      },
      actions: input.actions ?? [],
    }),
    [input]
  );
}
