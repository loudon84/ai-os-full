import { NextResponse } from "next/server";
import { fetchFromGateway, toHermesError } from "@/modules/hermes/services/hermes.bff";
import { HermesSkillSchema } from "@/modules/hermes/types/hermes.schemas";

export async function GET() {
  try {
    const data = await fetchFromGateway("/skills", {
      schema: HermesSkillSchema.array(),
    });
    return NextResponse.json(data);
  } catch (err) {
    const error = toHermesError(err);
    const status = error.code === "HERMES_GATEWAY_UNREACHABLE" ? 503 : 502;
    return NextResponse.json(error, { status });
  }
}
