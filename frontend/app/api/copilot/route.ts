/**
 * /api/copilot CopilotKit Runtime endpoint (Next.js App Router)
 *
 * Important:
 * - CopilotKit UI defaults to agentId = "default" unless configured otherwise.
 * - We register "default" and map it to Hermes "finance" agent, so the UI works
 *   out of the box while still supporting explicit finance/risk/forecast routing.
 * - All agent runs connect to Hermes AI Gateway.
 */
import { CopilotRuntime, copilotRuntimeNextJSAppRouterEndpoint } from "@copilotkit/runtime";
import { HermesGatewayStreamingAgent } from "@/modules/hermes/copilot/gateway-streaming-agent";

const runtime = new CopilotRuntime({
  agents: {
    default: new HermesGatewayStreamingAgent("finance"),
    finance: new HermesGatewayStreamingAgent("finance"),
    risk: new HermesGatewayStreamingAgent("risk"),
    forecast: new HermesGatewayStreamingAgent("forecast"),
  },
});

const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
  runtime,
  endpoint: "/api/copilot",
});

export const GET = handleRequest;
export const POST = handleRequest;
