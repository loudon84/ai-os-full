"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { useCallback, useRef } from "react";

import type { EmailMessageResponse } from "@portal/shared";

import { requestEmailAiCompletion } from "../lib/email-ai-completion";

export type EmailAgentResultPayload = {
  title: string;
  markdown: string;
  action: string;
};

const AGENT_SYSTEM_HINT: Record<string, string> = {
  finance: "你侧重财务与经营指标解读。",
  risk: "你侧重风险与合规提示。",
  forecast: "你侧重预测与情景分析。",
  default: "你是通用业务助手。",
};

export function useEmailAgentActions(input: {
  selectedMail: EmailMessageResponse | null;
  /** 撰写模式下从编辑器读取纯文本（可选） */
  getComposePlainText?: () => string | null;
  onResult?: (payload: EmailAgentResultPayload) => void;
}) {
  const mailRef = useRef(input.selectedMail);
  mailRef.current = input.selectedMail;
  const getComposeRef = useRef(input.getComposePlainText);
  getComposeRef.current = input.getComposePlainText;

  const notify = useCallback(
    (title: string, markdown: string, action: string) => {
      input.onResult?.({ title, markdown, action });
    },
    [input],
  );

  const getMailText = useCallback(() => {
    const m = mailRef.current;
    if (!m) return "";
    return (m.text_body ?? m.snippet ?? "").trim();
  }, []);

  const getMailEnvelope = useCallback(() => {
    const m = mailRef.current;
    if (!m) return "";
    const sub = m.subject ?? "(无主题)";
    const from = m.from ? `${m.from.name ?? ""} <${m.from.address}>`.trim() : "";
    const to = m.to.map((x) => x.address).join(", ");
    return `主题: ${sub}\n发件人: ${from}\n收件人: ${to}`;
  }, []);

  const runSummarizeEmail = useCallback(async () => {
    if (!mailRef.current) {
      const msg = "请先在列表中选择一封邮件。";
      notify("邮件摘要", msg, "summarize_email");
      return msg;
    }
    const body = getMailText();
    if (!body) {
      const msg = "当前无可摘要的正文。";
      notify("邮件摘要", msg, "summarize_email");
      return msg;
    }
    const r = await requestEmailAiCompletion({
      system: "你是邮件助手。用简洁中文输出 3～6 条要点，使用 Markdown 无序列表。",
      user: `${getMailEnvelope()}\n\n正文:\n${body.slice(0, 12000)}`,
    });
    const text = r.ok ? r.text : `**错误**：${r.error}`;
    notify("邮件摘要", text, "summarize_email");
    return text;
  }, [getMailText, getMailEnvelope, notify]);

  const runDraftReply = useCallback(async () => {
    if (!mailRef.current) {
      const msg = "请先在列表中选择一封邮件。";
      notify("回复草稿", msg, "draft_reply");
      return msg;
    }
    const body = getMailText();
    const env = getMailEnvelope();
    const r = await requestEmailAiCompletion({
      system:
        "你是邮件助手。根据邮件内容写一封礼貌、专业的中文回复草稿。只输出邮件正文，可使用简短 Markdown（加粗、列表）。不要输出主题行。",
      user: `${env}\n\n原邮件正文:\n${(body || "(仅见主题/元数据)").slice(0, 12000)}`,
    });
    const text = r.ok ? r.text : `**错误**：${r.error}`;
    notify("回复草稿", text, "draft_reply");
    return text;
  }, [getMailText, getMailEnvelope, notify]);

  const runTranslateEmail = useCallback(
    async (targetLang: string) => {
      if (!mailRef.current) {
        const msg = "请先在列表中选择一封邮件。";
        notify("翻译", msg, "translate_email");
        return msg;
      }
      const body = getMailText() || getMailEnvelope();
      const r = await requestEmailAiCompletion({
        system: `你是翻译。将用户给出的邮件内容翻译为「${targetLang}」，保持邮件语气。只输出译文。`,
        user: body.slice(0, 12000),
      });
      const text = r.ok ? r.text : `**错误**：${r.error}`;
      notify(`翻译（${targetLang}）`, text, "translate_email");
      return text;
    },
    [getMailText, getMailEnvelope, notify],
  );

  const runExtractTasks = useCallback(async () => {
    if (!mailRef.current) {
      const msg = "请先在列表中选择一封邮件。";
      notify("任务提取", msg, "extract_tasks");
      return msg;
    }
    const body = getMailText();
    const r = await requestEmailAiCompletion({
      system:
        "从邮件中提取待办事项。使用 Markdown：二级标题「待办清单」，下面用 `- [ ] 任务描述` 列表。若无明确待办，说明「未发现明确待办」。",
      user: `${getMailEnvelope()}\n\n正文:\n${(body || (mailRef.current?.snippet ?? "")).slice(0, 12000)}`,
    });
    const text = r.ok ? r.text : `**错误**：${r.error}`;
    notify("任务提取", text, "extract_tasks");
    return text;
  }, [getMailText, getMailEnvelope, notify]);

  const runExtractData = useCallback(async () => {
    if (!mailRef.current) {
      const msg = "请先在列表中选择一封邮件。";
      notify("数据提取", msg, "extract_data");
      return msg;
    }
    const body = getMailText();
    const r = await requestEmailAiCompletion({
      system:
        "从邮件中提取关键数据（日期、金额、人名、账号、订单号等）。用 Markdown 表格或列表呈现；不确定项标注「待确认」。",
      user: `${getMailEnvelope()}\n\n正文:\n${(body || (mailRef.current?.snippet ?? "")).slice(0, 12000)}`,
    });
    const text = r.ok ? r.text : `**错误**：${r.error}`;
    notify("数据提取", text, "extract_data");
    return text;
  }, [getMailText, getMailEnvelope, notify]);

  const runCustomAgent = useCallback(
    async (agentId: string, userGoal: string) => {
      const hint = AGENT_SYSTEM_HINT[agentId] ?? AGENT_SYSTEM_HINT.default;
      const body = getMailText();
      const r = await requestEmailAiCompletion({
        system: `你是 Portal 中的业务 Agent（${agentId}）。${hint} 根据用户目标与邮件内容作答，使用中文与 Markdown。`,
        user: `用户目标: ${userGoal}\n\n${getMailEnvelope()}\n\n正文:\n${(body || "").slice(0, 12000)}`,
      });
      const text = r.ok ? r.text : `**错误**：${r.error}`;
      notify(`Agent：${agentId}`, text, "custom_agent");
      return text;
    },
    [getMailText, getMailEnvelope, notify],
  );

  const runPolishCompose = useCallback(
    async (instruction: string) => {
      const draft = (getComposeRef.current?.() ?? "").trim();
      if (!draft) {
        const msg = "编辑器暂无内容可润色。";
        notify("润色", msg, "polish_compose");
        return msg;
      }
      const r = await requestEmailAiCompletion({
        system: `你是邮件写作助手。按用户指令润色以下邮件正文，保留 HTML 语义时可改为纯文本/Markdown 输出。只输出修改后的正文。`,
        user: `指令: ${instruction}\n\n草稿:\n${draft.slice(0, 12000)}`,
      });
      const text = r.ok ? r.text : `**错误**：${r.error}`;
      notify("润色结果", text, "polish_compose");
      return text;
    },
    [notify],
  );

  const runTranslatePlainText = useCallback(
    async (targetLang: string) => {
      const draft = (getComposeRef.current?.() ?? "").trim();
      if (!draft) {
        const msg = "编辑器暂无内容可翻译。";
        notify("翻译", msg, "translate_compose");
        return msg;
      }
      const r = await requestEmailAiCompletion({
        system: `你是翻译。将用户给出的邮件正文翻译为「${targetLang}」，保持邮件语气。只输出译文，可用 Markdown。`,
        user: draft.slice(0, 12000),
      });
      const text = r.ok ? r.text : `**错误**：${r.error}`;
      notify(`翻译（${targetLang}）`, text, "translate_compose");
      return text;
    },
    [notify],
  );

  useCopilotAction({
    name: "summarize_email",
    description: "总结当前选中邮件的要点（中文摘要）。",
    parameters: [],
    handler: async () => runSummarizeEmail(),
  });

  useCopilotAction({
    name: "draft_reply",
    description: "根据当前选中邮件生成中文回复草稿。",
    parameters: [],
    handler: async () => runDraftReply(),
  });

  useCopilotAction({
    name: "translate_email",
    description: "将当前选中邮件正文翻译为目标语言。",
    parameters: [
      {
        name: "target_lang",
        type: "string",
        description: "目标语言，例如：English、日本語、简体中文",
        required: true,
      },
    ],
    handler: async ({ target_lang }: { target_lang: string }) => runTranslateEmail(target_lang),
  });

  useCopilotAction({
    name: "extract_tasks",
    description: "从当前选中邮件提取待办事项清单。",
    parameters: [],
    handler: async () => runExtractTasks(),
  });

  useCopilotAction({
    name: "extract_data",
    description: "从当前选中邮件提取关键数据（表格/列表）。",
    parameters: [],
    handler: async () => runExtractData(),
  });

  useCopilotAction({
    name: "custom_agent",
    description: "使用指定业务 Agent（finance / risk / forecast / default）结合当前邮件回答自定义问题。",
    parameters: [
      {
        name: "agent_id",
        type: "string",
        description: "Agent：finance | risk | forecast | default",
        required: true,
      },
      {
        name: "user_goal",
        type: "string",
        description: "希望 Agent 完成的任务描述",
        required: true,
      },
    ],
    handler: async ({ agent_id, user_goal }: { agent_id: string; user_goal: string }) =>
      runCustomAgent(agent_id || "default", user_goal),
  });

  useCopilotAction({
    name: "polish_compose",
    description: "润色或改写当前撰写框中的邮件正文（需全屏撰写已打开）。",
    parameters: [
      {
        name: "instruction",
        type: "string",
        description: "润色要求，例如：更正式、更简短、改成英文",
        required: true,
      },
    ],
    handler: async ({ instruction }: { instruction: string }) => runPolishCompose(instruction),
  });

  return {
    runSummarizeEmail,
    runDraftReply,
    runTranslateEmail,
    runTranslatePlainText,
    runExtractTasks,
    runExtractData,
    runCustomAgent,
    runPolishCompose,
  };
}
