import { NextRequest, NextResponse } from "next/server";
import { seedAnomalyItems, seedRuleStatus } from "@/modules/finance/mocks/finance.seed";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: seedAnomalyItems,
    total: seedAnomalyItems.length,
    ruleStatus: seedRuleStatus,
  });
}
