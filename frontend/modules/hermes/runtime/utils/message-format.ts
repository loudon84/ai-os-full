import type { RuntimeMessage } from "../types";

/**
 * 本文件汇总 hermes-webui `ui.js::renderMessages()` 中与消息展示相关的辅助函数：
 * - thinking 文本抽取（多格式）
 * - 时间戳格式化（footer 简短 + 日期分隔符）
 * - 可见消息过滤
 */

const THINK_OPEN_CLOSE_PAIRS: Array<[RegExp, RegExp]> = [
  [/<think>([\s\S]*?)<\/think>/, /<think>[\s\S]*?<\/think>\s*/],
  // MiniMax <|channel>thought ... <channel|>
  [/<\|channel>thought\n([\s\S]*?)<channel\|>/, /<\|channel>thought\n[\s\S]*?<channel\|>\s*/],
  // Gemma 4 <|turn|>thinking ... <turn|>
  [/<\|turn\|>thinking\n([\s\S]*?)<turn\|>/, /<\|turn\|>thinking\n[\s\S]*?<turn\|>\s*/],
];

export type ExtractedMessage = {
  /** 渲染到 Markdown 的纯文本 */
  content: string;
  /** 若提取到，展示为 thinking / reasoning 折叠块 */
  thinking: string;
};

/** 从消息里提取思考文本 + 剩余正文。兼容 Anthropic content 数组 / 多种 XML 标签 / reasoning 字段。 */
export function extractMessageParts(m: RuntimeMessage): ExtractedMessage {
  let content: string = "";
  let thinking = "";

  const raw = m.content as unknown;
  if (Array.isArray(raw)) {
    for (const p of raw as Array<{ type?: string; text?: string; content?: string; thinking?: string; reasoning?: string }>) {
      if (!p || typeof p !== "object") continue;
      if (p.type === "thinking" || p.type === "reasoning") {
        thinking += `${p.thinking ?? p.reasoning ?? p.text ?? ""}\n`;
      } else if (p.type === "text") {
        content += `${p.text ?? p.content ?? ""}\n`;
      }
    }
    content = content.trim();
    thinking = thinking.trim();
  } else {
    content = typeof raw === "string" ? raw : String(raw ?? "");
  }

  if (!thinking && m.reasoning) thinking = m.reasoning;

  if (!thinking && typeof content === "string") {
    for (const [openRe, stripRe] of THINK_OPEN_CLOSE_PAIRS) {
      const match = content.match(openRe);
      if (match) {
        thinking = match[1].trim();
        content = content.replace(stripRe, "").trimStart();
        break;
      }
    }
  }

  return { content, thinking };
}

/** 消息是否应当渲染（过滤 tool 原始消息、空壳 assistant 等） */
export function isMessageVisible(m: RuntimeMessage): boolean {
  if (!m || !m.role) return false;
  if (m.role === "tool") return false;
  if (m.role === "system") return false;
  const { content, thinking } = extractMessageParts(m);
  const hasAttachments = Array.isArray(m.attachments) && m.attachments.length > 0;
  const hasToolCalls = Array.isArray(m.tool_calls) && m.tool_calls.length > 0;
  if (m.role === "assistant") {
    return Boolean(content || thinking || hasAttachments || hasToolCalls);
  }
  return Boolean(content || hasAttachments);
}

function toMillis(ts: number | undefined | null): number | null {
  if (ts == null) return null;
  const n = Number(ts);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n < 1e12 ? n * 1000 : n;
}

function getMessageTimeMs(m: RuntimeMessage): number | null {
  return toMillis(m._ts) ?? toMillis(m.timestamp);
}

/**
 * 简短 footer 时间戳：
 * - 同一天 → HH:MM
 * - 昨天 → "昨天 HH:MM"
 * - 7 天内 → "周X HH:MM"
 * - 更早 → "YYYY-MM-DD HH:MM"
 */
export function formatMessageTime(m: RuntimeMessage, now: Date = new Date()): string {
  const ms = getMessageTimeMs(m);
  if (ms == null) return "";
  const d = new Date(ms);
  const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return hm;

  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (
    d.getFullYear() === yest.getFullYear() &&
    d.getMonth() === yest.getMonth() &&
    d.getDate() === yest.getDate()
  ) {
    return `昨天 ${hm}`;
  }

  const diffDays = Math.floor((now.getTime() - ms) / (24 * 60 * 60 * 1000));
  if (diffDays < 7) {
    const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    return `${weekdays[d.getDay()]} ${hm}`;
  }

  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `${ymd} ${hm}`;
}

/** 用于 hover tooltip 的完整时间 */
export function formatMessageTimeFull(m: RuntimeMessage): string {
  const ms = getMessageTimeMs(m);
  if (ms == null) return "";
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return "";
  }
}

/**
 * 日期分隔符文案：Today / Yesterday / YYYY-MM-DD
 */
export function formatDateSeparator(d: Date, now: Date = new Date()): string {
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return "今天";

  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (
    d.getFullYear() === yest.getFullYear() &&
    d.getMonth() === yest.getMonth() &&
    d.getDate() === yest.getDate()
  ) {
    return "昨天";
  }

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 计算相邻两条消息是否跨天，用于是否插入日期分隔符 */
export function shouldShowDateSeparator(
  prev: RuntimeMessage | null,
  curr: RuntimeMessage
): { show: boolean; date: Date | null } {
  const ms = getMessageTimeMs(curr);
  if (ms == null) return { show: false, date: null };
  const d = new Date(ms);
  if (!prev) return { show: true, date: d };
  const prevMs = getMessageTimeMs(prev);
  if (prevMs == null) return { show: true, date: d };
  const pd = new Date(prevMs);
  const sameDay =
    d.getFullYear() === pd.getFullYear() &&
    d.getMonth() === pd.getMonth() &&
    d.getDate() === pd.getDate();
  return { show: !sameDay, date: d };
}
