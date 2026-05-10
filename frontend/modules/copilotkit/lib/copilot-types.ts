export type CopilotRole = "user" | "assistant" | "system" | "tool";

export type CopilotMessage = {
  id: string;
  role: CopilotRole;
  content: string;
  createdAt: string;
  status?: "idle" | "streaming" | "done" | "error";
};

export type PageCopilotSelection =
  | {
      type: "none";
      payload: null;
    }
  | {
      type: "table-row";
      payload: Record<string, unknown>;
    }
  | {
      type: "table-selection";
      payload: Record<string, unknown>[];
    }
  | {
      type: "form";
      payload: Record<string, unknown>;
    }
  | {
      type: "text";
      payload: {
        text: string;
      };
    }
  | {
      type: "card";
      payload: Record<string, unknown>;
    };

export type CopilotActionDefinition = {
  id: string;
  label: string;
  description?: string;
  dangerous?: boolean;
  requiredPermission?: string;
};

export type PageCopilotContext = {
  pageId: string;
  pageTitle: string;
  route: string;
  module: string;
  summary?: string;
  selection?: PageCopilotSelection;
  actions?: CopilotActionDefinition[];
};

export type CopilotChatRequest = {
  sessionId?: string;
  messages: CopilotMessage[];
  pageContext?: PageCopilotContext;
};

export type CopilotSuggestedAction = {
  id: string;
  payload?: Record<string, unknown>;
};

export type CopilotChatResponse = {
  sessionId: string;
  reply: CopilotMessage;
  suggestedActions?: CopilotSuggestedAction[];
  debug?: {
    upstream?: string;
    latencyMs?: number;
  };
};
