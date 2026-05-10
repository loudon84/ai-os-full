import { NextRequest, NextResponse } from "next/server";
import { seedAuditEntries } from "@/modules/finance/mocks/finance.seed";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: seedAuditEntries,
  });
}
