import { NextRequest, NextResponse } from "next/server";
import { seedReceivableItems, seedReceivableKpi } from "@/modules/finance/mocks/finance.seed";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: seedReceivableItems,
    total: seedReceivableItems.length,
    kpi: seedReceivableKpi,
  });
}
