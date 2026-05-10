"use client";

import { type ReactNode } from "react";
import { usePermission } from "../hooks";

export function PermissionGuard({
  permissionCode,
  children,
  fallback,
}: {
  permissionCode: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const hasPermission = usePermission(permissionCode);

  if (!hasPermission) {
    return fallback ?? null;
  }

  return <>{children}</>;
}
