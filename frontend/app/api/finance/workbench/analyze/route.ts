import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const taskId = `task-${Date.now()}`;
  return NextResponse.json({ taskId, status: "running" });
}
