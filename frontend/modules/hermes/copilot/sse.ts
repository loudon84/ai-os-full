/**
 * SSE Utilities
 * Encoding and header helpers for Server-Sent Events.
 */

/**
 * Encode a single SSE event frame
 */
export function encodeSseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Standard SSE response headers
 */
export function createSseHeaders(): HeadersInit {
  return {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  };
}
