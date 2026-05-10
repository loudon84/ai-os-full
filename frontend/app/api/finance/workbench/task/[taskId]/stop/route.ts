import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const { taskId } = params;
  return NextResponse.json({ taskId, status: "stopped" });
}
