/**
 * 将业务「范围键」（如邮件 message id）与 Hermes runtime `session_id` 绑定，便于关闭明细后再次打开时续聊。
 * 仅存于浏览器 localStorage。
 */
const STORAGE_KEY = "hermes-portal-panel-session-bindings";

type BindingMap = Record<string, string>;

function readMap(): BindingMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as BindingMap)
      : {};
  } catch {
    return {};
  }
}

function writeMap(map: BindingMap): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* quota / private mode */
  }
}

/** 邮件等业务建议使用 `email:${messageId}`，避免与其它范围冲突 */
export function scopeKeyEmailMessage(messageId: string): string {
  return `email:${messageId}`;
}

/** 文档详情页 Hermes 面板续聊键 */
export function scopeKeyDocument(documentId: string): string {
  return `document:${documentId}`;
}

export function getPanelSessionBinding(scopeKey: string): string | undefined {
  const id = readMap()[scopeKey];
  return typeof id === "string" && id.length > 0 ? id : undefined;
}

export function setPanelSessionBinding(scopeKey: string, sessionId: string): void {
  const map = readMap();
  map[scopeKey] = sessionId;
  writeMap(map);
}

export function clearPanelSessionBinding(scopeKey: string): void {
  const map = readMap();
  if (!(scopeKey in map)) return;
  delete map[scopeKey];
  writeMap(map);
}
