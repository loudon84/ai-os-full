import { NextRequest, NextResponse } from "next/server";
import { seedWorkbenchKpi } from "@/modules/finance/mocks/finance.seed";

export async function GET(request: NextRequest) {
  return NextResponse.json(seedWorkbenchKpi);
}
