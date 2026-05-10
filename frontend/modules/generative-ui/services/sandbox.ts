/**
 * Sandbox iframe 运行时：仅允许 allow-scripts、allow-same-origin。
 * 文档通过 srcDoc 注入 React UMD + 组件源码字符串。
 */

export const SANDBOX_ATTR = "allow-scripts allow-same-origin";

export function buildSandboxSrcDoc(
  componentCode: string,
  props: Record<string, unknown>,
): string {
  const propsJson = JSON.stringify(props);
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  body { margin: 0; font-family: system-ui, sans-serif; background: #fff; color: #0f172a; }
  #root { min-height: 120px; padding: 8px; box-sizing: border-box; }
  .sandbox-error { color: #b91c1c; padding: 12px; font-size: 13px; white-space: pre-wrap; }
</style>
</head>
<body>
<div id="root"></div>
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script>
(function () {
  var props = ${propsJson};
  var rootEl = document.getElementById("root");
  try {
${componentCode.replace(/<\/script>/gi, "<\\/script>")}
    var Comp =
      typeof Generated !== "undefined"
        ? Generated
        : typeof window.GeneratedComponent !== "undefined"
          ? window.GeneratedComponent
          : null;
    if (!Comp) {
      throw new Error("组件代码须定义 Generated 或 window.GeneratedComponent");
    }
    var root = ReactDOM.createRoot(rootEl);
    root.render(React.createElement(Comp, props));
  } catch (err) {
    var msg = err && err.message ? err.message : String(err);
    rootEl.innerHTML = '<div class="sandbox-error">渲染错误：' + msg + "</div>";
  }
})();
</script>
</body>
</html>`;
}

export function createSandboxFrame(
  componentName: string,
  props: Record<string, unknown>,
  componentCode: string,
): HTMLIFrameElement {
  if (typeof document === "undefined") {
    throw new Error("createSandboxFrame 仅在浏览器环境可用");
  }
  const iframe = document.createElement("iframe");
  iframe.title = componentName;
  iframe.setAttribute("sandbox", SANDBOX_ATTR);
  iframe.srcdoc = buildSandboxSrcDoc(componentCode, props);
  iframe.style.width = "100%";
  iframe.style.minHeight = "200px";
  iframe.style.border = "1px solid var(--border, #e2e8f0)";
  iframe.style.borderRadius = "8px";
  iframe.style.background = "#fff";
  return iframe;
}

export function renderInSandbox(
  iframe: HTMLIFrameElement,
  componentCode: string,
  props: Record<string, unknown>,
): void {
  iframe.srcdoc = buildSandboxSrcDoc(componentCode, props);
}

export function destroySandbox(iframe: HTMLIFrameElement | null): void {
  if (!iframe) return;
  iframe.srcdoc = "";
  iframe.remove();
}
