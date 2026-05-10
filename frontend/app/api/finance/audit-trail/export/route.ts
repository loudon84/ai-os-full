import { NextRequest, NextResponse } from "next/server";
import { seedAuditEntries } from "@/modules/finance/mocks/finance.seed";

export async function GET(request: NextRequest) {
  const headers = "id,entityType,entityId,operator,action,timestamp";
  const rows = seedAuditEntries.map((entry) => {
    const changesStr = JSON.stringify(entry.changes).replace(/"/g, '""');
    return `${entry.id},${entry.entityType},${entry.entityId},${entry.operator},${entry.action},"${changesStr}",${entry.timestamp}`;
  });
  const csv = [headers + ",changes", ...rows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=audit-trail.csv",
    },
  });
}
