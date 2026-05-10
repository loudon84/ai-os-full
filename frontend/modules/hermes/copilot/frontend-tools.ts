/**
 * Hermes Frontend Tools
 * Registers CopilotKit frontend tools for page navigation,
 * session management, and data refresh.
 *
 * These tools are UI-side actions only — they do NOT call Hermes Gateway
 * or perform model inference. They control the Dashboard UI state.
 */
"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCopilotAction } from "@copilotkit/react-core";

export function useHermesFrontendTools() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Navigate to a page within Hermes module
  useCopilotAction({
    name: "navigate",
    description: "Navigate to a page in the Hermes dashboard. Available paths: /hermes, /hermes/sessions, /hermes/skills, /hermes/settings",
    parameters: [
      {
        name: "path",
        type: "string",
        description: "The path to navigate to",
        required: true,
      },
    ],
    handler: async ({ path }: { path: string }) => {
      router.push(path);
      return `Navigated to ${path}`;
    },
  });

  // Open a specific session
  useCopilotAction({
    name: "open_session",
    description: "Open a specific Hermes session by ID. This navigates to the session detail page.",
    parameters: [
      {
        name: "sessionId",
        type: "string",
        description: "The session ID to open",
        required: true,
      },
    ],
    handler: async ({ sessionId }: { sessionId: string }) => {
      router.push(`/hermes/sessions/${sessionId}`);
      return `Opened session ${sessionId}`;
    },
  });

  // Refresh dashboard data
  useCopilotAction({
    name: "refresh_hermes_data",
    description: "Refresh all Hermes dashboard data. Invalidates the TanStack Query cache.",
    parameters: [
      {
        name: "scope",
        type: "string",
        description: "Optional scope to refresh: 'all', 'metrics', 'sessions', 'skills', 'models', 'health'",
        required: false,
      },
    ],
    handler: async ({ scope }: { scope?: string }) => {
      if (scope && scope !== "all") {
        queryClient.invalidateQueries({ queryKey: ["hermes", scope] });
        return `Refreshed ${scope} data`;
      }
      queryClient.invalidateQueries({ queryKey: ["hermes"] });
      return "Refreshed all Hermes data";
    },
  });

  // Navigate to sessions with a status filter
  useCopilotAction({
    name: "filter_sessions",
    description: "Navigate to the sessions page with a status filter applied.",
    parameters: [
      {
        name: "status",
        type: "string",
        description: "The session status to filter by: idle, running, error, done",
        required: true,
      },
    ],
    handler: async ({ status }: { status: string }) => {
      router.push(`/hermes/sessions?status=${status}`);
      return `Filtered sessions by status: ${status}`;
    },
  });
}
