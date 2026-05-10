import { NextRequest, NextResponse } from "next/server";

import type { AiOsFormSubmitRequest, AiOsFormSubmitResponse } from "@/modules/form/types/form-submit";
import { validateFormData } from "@/modules/form/validators/validate-form-data";

import preOrderIntakeSpec from "@/modules/form/schemas/examples/pre-order-intake.form.json";
import cashDailyReportSpec from "@/modules/form/schemas/examples/cash-daily-report.form.json";

export const dynamic = "force-dynamic";

function loadSpec(formId: string) {
  if (formId === preOrderIntakeSpec.formId) return preOrderIntakeSpec as any;
  if (formId === cashDailyReportSpec.formId) return cashDailyReportSpec as any;
  return null;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as AiOsFormSubmitRequest | null;
  if (!body?.formId || !body?.formData || !body?.submitMode) {
    const res: AiOsFormSubmitResponse = { ok: false, message: "请求体不合法" };
    return NextResponse.json(res, { status: 400 });
  }

  const spec = loadSpec(body.formId);
  if (!spec) {
    const res: AiOsFormSubmitResponse = { ok: false, message: `未知 formId: ${body.formId}` };
    return NextResponse.json(res, { status: 404 });
  }

  const validation = validateFormData(spec.schema as any, body.formData);
  if (!validation.valid) {
    const res: AiOsFormSubmitResponse = {
      ok: false,
      message: "表单数据校验失败",
      errors: validation.errors.map((e) => ({
        path: e.path,
        message: e.message,
        code: e.keyword,
      })),
    };
    return NextResponse.json(res, { status: 422 });
  }

  const res: AiOsFormSubmitResponse = {
    ok: true,
    submissionId: `sub_mock_${Math.random().toString(16).slice(2, 10)}`,
    message: "提交成功",
  };
  return NextResponse.json(res, { status: 200 });
}

