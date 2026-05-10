import { NextRequest, NextResponse } from "next/server";
import { seedReceivableDetail } from "@/modules/finance/mocks/finance.seed";

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const { clientId } = params;
  return NextResponse.json({ ...seedReceivableDetail, clientId });
}
