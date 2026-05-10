"use client";

import { useCallback, useRef, useState } from "react";
import { SANDBOX_ATTR, buildSandboxSrcDoc, destroySandbox } from "../services/sandbox";

export function useSandboxRenderer() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initSandbox = useCallback(() => {
    setError(null);
    setIsRendering(false);
  }, []);

  const renderCode = useCallback((code: string, props: Record<string, unknown>) => {
    const iframe = iframeRef.current;
    if (!iframe) {
      setError("iframe 尚未挂载");
      return;
    }
    setIsRendering(true);
    setError(null);
    try {
      iframe.setAttribute("sandbox", SANDBOX_ATTR);
      iframe.srcdoc = buildSandboxSrcDoc(code, props);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsRendering(false);
    }
  }, []);

  const destroy = useCallback(() => {
    destroySandbox(iframeRef.current);
    iframeRef.current = null;
    setIsRendering(false);
    setError(null);
  }, []);

  return { iframeRef, initSandbox, renderCode, destroy, isRendering, error };
}
