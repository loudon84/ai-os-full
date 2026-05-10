import { NextResponse } from "next/server";
import {
  fetchFromGateway,
  toHermesError,
} from "@/modules/hermes/services/hermes.bff";
import { GatewayHealthDetailedSchema } from "@/modules/hermes/types/gateway.schemas";

export async function GET() {
  try {
    const data = await fetchFromGateway("/health/detailed", {
      schema: GatewayHealthDetailedSchema,
    });
    return NextResponse.json(data);
  } catch (err) {
    const error = toHermesError(err);
    const status = error.code === "HERMES_GATEWAY_UNREACHABLE" ? 503 : 502;
    return NextResponse.json(error, { status });
  }
}

