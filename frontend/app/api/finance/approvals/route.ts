import { NextRequest, NextResponse } from "next/server";
import { seedApprovalItems } from "@/modules/finance/mocks/finance.seed";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: seedApprovalItems,
    total: seedApprovalItems.length,
  });
}
