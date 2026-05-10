import { NextRequest, NextResponse } from "next/server";

import { validateFormSpec } from "@/modules/form/validators/validate-form-spec";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const spec = (body as any)?.spec;
  const result = validateFormSpec(spec);
  return NextResponse.json(result, { status: 200 });
}

