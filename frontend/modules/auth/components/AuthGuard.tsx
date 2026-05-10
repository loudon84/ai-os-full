"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../stores/auth-store";
import { tokenManager } from "../lib/token-manager";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, workspaceId, refreshAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!tokenManager.isAuthenticated()) {
      router.replace("/login");
      return;
    }
    if (!isAuthenticated) {
      refreshAuth().catch(() => router.replace("/login"));
    }
  }, [isAuthenticated, refreshAuth, router]);

  if (!isAuthenticated) return null;

  if (!workspaceId) {
    router.replace("/workspace/select");
    return null;
  }

  return <>{children}</>;
}
