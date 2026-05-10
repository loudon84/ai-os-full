"use server";

import { revalidatePath } from "next/cache";

/**
 * Finance Server Actions
 * Used for mutations that need cache revalidation
 */

export async function updateAnomalyStatusAction(id: string, status: string) {
  // TODO: call real API
  revalidatePath("/finance/invoice-anomalies");
  return { id, status };
}

export async function submitApprovalAction(id: string, action: "approve" | "reject", comment?: string) {
  // TODO: call real API
  revalidatePath("/finance/approvals");
  return { id, status: action === "approve" ? "approved" : "rejected" };
}

export async function createReportAction(name: string, type: string) {
  // TODO: call real API
  revalidatePath("/finance/reports");
  return { id: `r-${Date.now()}`, status: "draft" };
}

export async function submitReportAction(id: string) {
  // TODO: call real API
  revalidatePath("/finance/reports");
  return { id, status: "pending_approval" };
}
