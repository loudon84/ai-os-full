import { NextRequest, NextResponse } from "next/server";
import { seedCashflowForecast } from "@/modules/finance/mocks/finance.seed";

export async function GET(request: NextRequest) {
  return NextResponse.json(seedCashflowForecast);
}
