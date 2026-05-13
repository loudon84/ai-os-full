/**
 * 将 HTML 邮件正文转为纯文本（供 Hermes 上下文等使用，不替代 iframe 渲染）。
 */
export function htmlToPlainText(html: string): string {
  if (!html.trim()) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, style").forEach((el) => el.remove());
  const text = doc.body?.textContent ?? "";
  return text.replace(/\n{3,}/g, "\n\n").trim();
}
