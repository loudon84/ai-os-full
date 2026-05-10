import { NextRequest, NextResponse } from "next/server";
import { seedReportDetail } from "@/modules/finance/mocks/finance.seed";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  return NextResponse.json({ ...seedReportDetail, id });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  return NextResponse.json({ id, version: 1 });
}
