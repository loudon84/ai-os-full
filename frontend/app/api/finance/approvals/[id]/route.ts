import { NextRequest, NextResponse } from "next/server";
import { seedApprovalDetail } from "@/modules/finance/mocks/finance.seed";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  return NextResponse.json({ ...seedApprovalDetail, id });
}
