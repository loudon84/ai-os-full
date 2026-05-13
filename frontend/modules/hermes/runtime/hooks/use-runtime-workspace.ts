"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRuntimeSessionStore } from "../stores/runtime-session-store";
import type { RuntimeFileContent, RuntimeFsEntry } from "../types";

type ListDirResponse = {
  entries: RuntimeFsEntry[];
  path: string;
};

function sanitizeRelPath(input: string): string {
  const raw = input.trim().replace(/\\/g, "/");
  if (!raw || raw === "/") return ".";
  const parts = raw
    .split("/")
    .filter(Boolean)
    .filter((p) => p !== "." && p !== "..");
  return parts.length ? parts.join("/") : ".";
}

function parentDir(rel: string): string {
  const p = sanitizeRelPath(rel);
  if (p === ".") return ".";
  const parts = p.split("/");
  parts.pop();
  return parts.length ? parts.join("/") : ".";
}

async function apiJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...options, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export function useRuntimeWorkspace(explicitSessionId?: string | null) {
  const storeSessionId = useRuntimeSessionStore((s) => s.currentSession?.session_id ?? null);
  /** `undefined`：走全局 runtime store；`null` / `string`：仅绑定该会话（Hermes 面板等），不回退 store */
  const sessionId = explicitSessionId === undefined ? storeSessionId : explicitSessionId;

  const [currentDir, setCurrentDir] = useState<string>(".");
  const queryClient = useQueryClient();

  const listKey = useMemo(
    () => ["runtime-fs", sessionId, currentDir] as const,
    [sessionId, currentDir]
  );

  const listQuery = useQuery({
    queryKey: listKey,
    enabled: !!sessionId,
    queryFn: async () => {
      const url = `/api/hermes/runtime/list?session_id=${encodeURIComponent(
        sessionId as string
      )}&path=${encodeURIComponent(currentDir)}`;
      const data = await apiJson<ListDirResponse>(url);
      return {
        ...data,
        entries: Array.isArray(data.entries) ? data.entries : [],
      };
    },
  });

  const invalidateList = async () => {
    if (!sessionId) return;
    await queryClient.invalidateQueries({ queryKey: ["runtime-fs", sessionId] });
  };

  const createFile = useMutation({
    mutationFn: async (args: { path: string; content?: string }) => {
      if (!sessionId) throw new Error("No active session");
      return await apiJson<{ ok: boolean; path: string }>("/api/hermes/runtime/file/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          path: sanitizeRelPath(args.path),
          content: args.content ?? "",
        }),
      });
    },
    onSuccess: invalidateList,
  });

  const createDir = useMutation({
    mutationFn: async (args: { path: string }) => {
      if (!sessionId) throw new Error("No active session");
      return await apiJson<{ ok: boolean; path: string }>("/api/hermes/runtime/file/create-dir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          path: sanitizeRelPath(args.path),
        }),
      });
    },
    onSuccess: invalidateList,
  });

  const rename = useMutation({
    mutationFn: async (args: { path: string; newName: string }) => {
      if (!sessionId) throw new Error("No active session");
      return await apiJson<{ ok: boolean; old_path: string; new_path: string }>(
        "/api/hermes/runtime/file/rename",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            path: sanitizeRelPath(args.path),
            new_name: args.newName.trim(),
          }),
        }
      );
    },
    onSuccess: invalidateList,
  });

  const remove = useMutation({
    mutationFn: async (args: { path: string }) => {
      if (!sessionId) throw new Error("No active session");
      return await apiJson<{ ok: boolean; path: string }>("/api/hermes/runtime/file/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          path: sanitizeRelPath(args.path),
        }),
      });
    },
    onSuccess: invalidateList,
  });

  const saveFile = useMutation({
    mutationFn: async (args: { path: string; content: string }) => {
      if (!sessionId) throw new Error("No active session");
      return await apiJson<{ ok: boolean; path: string; size: number }>(
        "/api/hermes/runtime/file/save",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            path: sanitizeRelPath(args.path),
            content: args.content ?? "",
          }),
        }
      );
    },
    onSuccess: async () => {
      await invalidateList();
    },
  });

  const readTextFile = async (path: string) => {
    if (!sessionId) throw new Error("No active session");
    const url = `/api/hermes/runtime/file?session_id=${encodeURIComponent(
      sessionId
    )}&path=${encodeURIComponent(sanitizeRelPath(path))}`;
    return await apiJson<RuntimeFileContent & { binary?: boolean }>(url);
  };

  const buildRawUrl = (path: string) => {
    if (!sessionId) return "";
    return `/api/hermes/runtime/file/raw?session_id=${encodeURIComponent(
      sessionId
    )}&path=${encodeURIComponent(sanitizeRelPath(path))}`;
  };

  const navigate = (nextDir: string) => setCurrentDir(sanitizeRelPath(nextDir));
  const goUp = () => setCurrentDir((prev) => parentDir(prev));

  return {
    sessionId,
    currentDir,
    setCurrentDir: navigate,
    goUp,

    listQuery,
    entries: listQuery.data?.entries ?? [],
    dirPath: listQuery.data?.path ?? currentDir,

    createFile,
    createDir,
    rename,
    remove,
    saveFile,
    readTextFile,
    buildRawUrl,
    refresh: async () => {
      await invalidateList();
      await queryClient.refetchQueries({ queryKey: listKey });
    },
  };
}

