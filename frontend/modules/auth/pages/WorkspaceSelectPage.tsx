"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "../stores/auth-store";

export default function WorkspaceSelectPage() {
  const { workspaces, selectWorkspace } = useAuthStore();
  const router = useRouter();

  const handleSelect = (workspaceId: string) => {
    selectWorkspace(workspaceId);
    router.push("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Select Workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a workspace to continue
          </p>
        </div>
        {workspaces.length === 0 ? (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              You don&apos;t have any workspaces yet.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
            >
              Create Workspace
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {workspaces.map((w) => (
              <button
                key={w.id}
                onClick={() => handleSelect(w.id)}
                className="w-full rounded-md border px-4 py-3 text-left text-sm hover:bg-accent"
              >
                {w.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
