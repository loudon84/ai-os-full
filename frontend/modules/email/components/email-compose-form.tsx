"use client";

import type { MutableRefObject } from "react";
import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Maximize2, Minimize2, Minus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendEmailSchema } from "@portal/shared";

import { parseAddressList } from "../lib/email-address-utils";
import { sendEmailMessage } from "../services/email-api";
import { useEmailStore } from "../stores/email-store";
import type { EmailAgentResultPayload } from "../hooks/use-email-agent-actions";
import { cn } from "@/lib/utils";

import { EmailComposeAIPanel } from "./email-compose-ai-panel";
import { EmailComposeWorkspace } from "./email-compose-workspace";
import { EmailTiptapEditor, type EmailTiptapEditorHandle } from "./email-tiptap-editor";

const composeFormSchema = z
  .object({
    to: z.string().min(1, "请填写收件人"),
    cc: z.string().optional(),
    bcc: z.string().optional(),
    subject: z.string().min(1, "请填写主题"),
  })
  .strict();

type ComposeFormValues = z.infer<typeof composeFormSchema>;

export interface EmailComposeFormProps {
  onClose: () => void;
  onSent?: () => void;
  /** 供父组件注册：读取当前编辑器纯文本（用于撰写 AI） */
  editorPlainTextRef?: MutableRefObject<() => string>;
  composeAiResult?: EmailAgentResultPayload | null;
  onClearComposeAi?: () => void;
  runPolishCompose?: (instruction: string) => Promise<string>;
  runTranslatePlainText?: (lang: string) => Promise<string>;
}

export function EmailComposeForm({
  onClose,
  onSent,
  editorPlainTextRef,
  composeAiResult,
  onClearComposeAi,
  runPolishCompose,
  runTranslatePlainText,
}: EmailComposeFormProps) {
  const [minimize, setMinimize] = useState(false);
  const [maximize, setMaximize] = useState(false);
  const [isPending, startTransition] = useTransition();
  const editorRef = useRef<EmailTiptapEditorHandle>(null);

  const composeDraft = useEmailStore((s) => s.composeDraft);
  const composePresentation = useEmailStore((s) => s.composePresentation);
  const setComposePresentation = useEmailStore((s) => s.setComposePresentation);
  const clearCompose = useEmailStore((s) => s.clearCompose);

  const initialHtml = composeDraft?.quoteHtml ?? "";

  const { register, handleSubmit, reset, formState } = useForm<ComposeFormValues>({
    resolver: zodResolver(composeFormSchema),
    defaultValues: {
      to: "",
      cc: "",
      bcc: "",
      subject: "",
    },
  });

  useEffect(() => {
    if (!composeDraft) return;
    reset({
      to: composeDraft.to,
      cc: composeDraft.cc,
      bcc: composeDraft.bcc,
      subject: composeDraft.subject,
    });
  }, [composeDraft, reset]);

  useLayoutEffect(() => {
    if (!editorPlainTextRef) return;
    editorPlainTextRef.current = () => editorRef.current?.getText() ?? "";
  });

  const onSubmit = (values: ComposeFormValues) => {
    const html = editorRef.current?.getHTML().trim() ?? "";
    const text = editorRef.current?.getText().trim() ?? "";
    const emptyBlocks =
      html === "" ||
      html === "<p></p>" ||
      html === "<p><br></p>" ||
      /^<p>\s*<br\s*\/?>\s*<\/p>$/i.test(html);
    const body_html = emptyBlocks ? "" : html;

    const payload = {
      to: parseAddressList(values.to),
      cc: parseAddressList(values.cc ?? ""),
      bcc: parseAddressList(values.bcc ?? ""),
      subject: values.subject.trim(),
      body_html,
      body_text: text || null,
      in_reply_to: composeDraft?.inReplyTo ?? undefined,
      references:
        composeDraft?.references && composeDraft.references.length > 0
          ? composeDraft.references
          : undefined,
    };

    const parsed = sendEmailSchema.safeParse(payload);
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const msg =
        first.to?.[0] ?? first.subject?.[0] ?? first.body_html?.[0] ?? "请检查表单内容";
      toast.error(msg);
      return;
    }

    startTransition(async () => {
      const response = await sendEmailMessage(parsed.data);
      if (response.success) {
        toast.success("邮件已发送");
        onSent?.();
        clearCompose();
        onClose();
        return;
      }
      toast.error(response.error.message);
    });
  };

  const handleClose = () => {
    onClearComposeAi?.();
    clearCompose();
    onClose();
  };

  const appendMarkdownToEditor = (md: string) => {
    const safe = md.replace(/\r\n/g, "\n").trim();
    if (!safe) return;
    const asHtml = `<p></p><p>${safe.replace(/\n/g, "</p><p>")}</p>`;
    const cur = editorRef.current?.getHTML() ?? "";
    editorRef.current?.setContent(`${cur}${asHtml}`);
    editorRef.current?.focus();
    toast.success("已插入到正文末尾");
  };

  const isFullscreen = composePresentation === "fullscreen";
  const showComposeAi = isFullscreen && !!runPolishCompose && !!runTranslatePlainText;

  const innerForm = (
    <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="space-y-1">
        <Label htmlFor="to">收件人（多个用逗号或分号分隔）</Label>
        <Input id="to" {...register("to")} />
        {formState.errors.to && (
          <p className="text-xs text-destructive">{formState.errors.to.message}</p>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="cc">抄送</Label>
          <Input id="cc" {...register("cc")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="bcc">密送</Label>
          <Input id="bcc" {...register("bcc")} />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="subject">主题</Label>
        <Input id="subject" {...register("subject")} />
        {formState.errors.subject && (
          <p className="text-xs text-destructive">{formState.errors.subject.message}</p>
        )}
      </div>
      <EmailTiptapEditor
        ref={editorRef}
        key={`${composeDraft?.inReplyTo ?? "new"}-${composeDraft?.subject ?? ""}`}
        initialHtml={initialHtml}
        className="min-h-0 flex-1"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="submit" size="sm" className="min-w-[100px]" disabled={isPending}>
          {isPending ? "发送中…" : "发送"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setComposePresentation(isFullscreen ? "float" : "fullscreen")}
        >
          <Maximize2 className="me-1 h-4 w-4" />
          {isFullscreen ? "退出全屏" : "全屏撰写"}
        </Button>
      </div>
    </form>
  );

  const headerBar = (
    <div className="flex gap-3 rounded-t-md bg-primary/10 px-6 py-3.5">
      <div className="flex-1 text-sm font-medium text-default-900">撰写邮件</div>
      <button type="button" className="flex-none" onClick={handleMinimize}>
        <Minus className="h-5 w-5 text-default-500" />
      </button>
      {!isFullscreen && (
        <button type="button" className="hidden flex-none lg:block" onClick={handleMaximize}>
          <Minimize2 className="h-5 w-5 text-default-500" />
        </button>
      )}
      <button type="button" className="flex-none" onClick={handleClose}>
        <X className="h-5 w-5 text-default-500" />
      </button>
    </div>
  );

  if (isFullscreen) {
    return (
      <EmailComposeWorkspace
        header={headerBar}
        minimize={minimize}
        main={innerForm}
        rightPanel={
          showComposeAi ? (
            <EmailComposeAIPanel
              runPolishCompose={runPolishCompose}
              runTranslatePlainText={runTranslatePlainText}
              onAppendToEditor={appendMarkdownToEditor}
              result={composeAiResult ?? null}
              onClearResult={() => onClearComposeAi?.()}
            />
          ) : undefined
        }
      />
    );
  }

  return (
    <Card
      className={cn(
        "absolute bottom-0 z-20 w-[300px] bg-background ltr:right-2.5 rtl:left-2.5 sm:w-[400px] md:w-[500px] lg:w-[650px]",
        {
          "fixed top-1/2 h-[calc(100vh-350px)] -translate-y-1/2 shadow-2xl ltr:left-1/2 ltr:-translate-x-1/2 rtl:right-1/2 rtl:translate-x-1/2 lg:w-[800px] xl:w-[1000px]":
            maximize,
        },
      )}
    >
      <CardHeader className="mb-0 block border-none p-0">{headerBar}</CardHeader>
      <CardContent className={cn("px-6", { hidden: minimize })}>{innerForm}</CardContent>
    </Card>
  );

  function handleMaximize() {
    if (minimize) setMinimize(false);
    setMaximize((value) => !value);
  }

  function handleMinimize() {
    if (maximize) setMaximize(false);
    setMinimize((value) => !value);
  }
}
