import { NextRequest, NextResponse } from "next/server";
import { seedReportItems } from "@/modules/finance/mocks/finance.seed";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    data: seedReportItems,
    total: seedReportItems.length,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = `r-${Date.now()}`;
  return NextResponse.json({ id, status: "draft", ...body });
}
