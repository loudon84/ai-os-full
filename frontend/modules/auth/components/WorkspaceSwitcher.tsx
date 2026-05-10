"use client";

import { useAuthStore } from "../stores/auth-store";

export function WorkspaceSwitcher() {
  const { workspaces, workspaceId, selectWorkspace } = useAuthStore();

  if (workspaces.length === 0) return null;

  const current = workspaces.find((w) => w.id === workspaceId);

  return (
    <select
      value={workspaceId ?? ""}
      onChange={(e) => selectWorkspace(e.target.value)}
      className="rounded-md border px-3 py-1.5 text-sm"
    >
      {workspaces.map((w) => (
        <option key={w.id} value={w.id}>
          {w.name}
        </option>
      ))}
    </select>
  );
}
