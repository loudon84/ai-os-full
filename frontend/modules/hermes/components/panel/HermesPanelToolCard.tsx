"use client";

import { RuntimeToolCard } from "../../runtime/components/RuntimeToolCard";
import type { RuntimeToolCall } from "../../runtime/types";

export function HermesPanelToolCard({ toolCall }: { toolCall: RuntimeToolCall }) {
  return <RuntimeToolCard toolCall={toolCall} />;
}
