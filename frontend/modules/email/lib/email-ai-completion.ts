export type EmailAiCompletionResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

export async function requestEmailAiCompletion(input: {
  system: string;
  user: string;
}): Promise<EmailAiCompletionResult> {
  try {
    const res = await fetch("/api/email/ai-completion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system: input.system, user: input.user }),
    });
    const raw = await res.text();
    if (!res.ok) {
      let msg = `请求失败 (${res.status})`;
      try {
        const j = JSON.parse(raw) as { message?: string };
        if (j.message) msg = j.message;
      } catch {
        /* ignore */
      }
      return { ok: false, error: msg };
    }
    const data = JSON.parse(raw) as { text?: string };
    return { ok: true, text: data.text ?? "" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "网络错误" };
  }
}
