import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const { taskId } = params;
  return NextResponse.json({
    taskId,
    status: "completed",
    progress: 100,
    result: { message: "Analysis completed successfully" },
  });
}
