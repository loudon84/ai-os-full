"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type CopilotComposerProps = {
  loading?: boolean;
  onSend: (content: string) => Promise<void>;
};

export function CopilotComposer({
  loading,
  onSend,
}: CopilotComposerProps) {
  const [value, setValue] = useState("");

  async function handleSend() {
    const content = value.trim();
    if (!content) return;
    await onSend(content);
    setValue("");
  }

  return (
    <div className="border-t p-4">
      <Textarea
        rows={4}
        placeholder="输入你的问题，或让 AI 总结当前页面..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="mt-3 flex justify-end">
        <Button type="button" disabled={loading} onClick={handleSend}>
          {loading ? "处理中..." : "发送"}
        </Button>
      </div>
    </div>
  );
}
