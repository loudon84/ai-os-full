"use client";

import { useEffect, useState } from "react";

export type DocumentAiSseEventRecord = Record<string, unknown>;

/**
 * Consume a finite SSE payload (newline-delimited `data:` blocks).
 * Faster than relying on browser `EventSource` auto-reconnect after the stream ends.
 */
function parseAccumulatedSSE(buffer: string): { remainder: string; payloads: string[] } {
  const payloads: string[] = [];
  let working = buffer;
  for (;;) {
    const idx = working.indexOf("\n\n");
    if (idx < 0) break;
    const block = working.slice(0, idx).trimEnd();
    working = working.slice(idx + 2);
    let dataJoined = "";
    for (const line of block.split("\n")) {
      if (line.startsWith("data:")) {
        dataJoined += line.slice("data:".length).trimStart();
      }
    }
    if (dataJoined.trim()) payloads.push(dataJoined.trim());
  }
  return { remainder: working, payloads };
}

export function useDocumentAiSseTimeline(streamUrl: string | null): {
  events: DocumentAiSseEventRecord[];
  status: "idle" | "connecting" | "done" | "error";
} {
  const [events, setEvents] = useState<DocumentAiSseEventRecord[]>([]);
  const [status, setStatus] = useState<"idle" | "connecting" | "done" | "error">("idle");

  useEffect(() => {
    if (!streamUrl) {
      setEvents([]);
      setStatus("idle");
      return undefined;
    }

    const ac = new AbortController();
    setEvents([]);
    setStatus("connecting");

    (async () => {
      try {
        const res = await fetch(streamUrl, { signal: ac.signal, credentials: "include" });
        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${String(res.status)}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const parsed = parseAccumulatedSSE(buf);
          buf = parsed.remainder;
          for (const raw of parsed.payloads) {
            try {
              setEvents((prev) => [...prev, JSON.parse(raw) as DocumentAiSseEventRecord]);
            } catch {
              setEvents((prev) => [...prev, { type: "sse.raw", payload: raw }]);
            }
          }
        }

        const tailParse = parseAccumulatedSSE(`${buf.trimEnd()}\n\n`);
        for (const raw of tailParse.payloads) {
          try {
            setEvents((prev) => [...prev, JSON.parse(raw) as DocumentAiSseEventRecord]);
          } catch {
            setEvents((prev) => [...prev, { type: "sse.raw", payload: raw }]);
          }
        }

        setStatus("done");
      } catch {
        if (!ac.signal.aborted) setStatus("error");
      }
    })();

    return () => ac.abort();
  }, [streamUrl]);

  return { events, status };
}
