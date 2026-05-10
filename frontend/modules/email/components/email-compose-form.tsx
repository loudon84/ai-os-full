"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Minimize2, Minus, X } from "lucide-react";
import { useQuill } from "react-quilljs";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { z } from "zod";
import "quill/dist/quill.snow.css";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendEmailSchema } from "@portal/shared";

import { EMAIL_PERMISSION } from "../constants/permissions";
import { useEmailPermission } from "../hooks/use-email-permission";
import { parseAddressList } from "../lib/email-address-utils";
import { sendEmailMessage } from "../services/email-api";
import { cn } from "@/lib/utils";

const composeFormSchema = z
  .object({
    to: z.string().min(1, "请填写收件人"),
    cc: z.string().optional(),
    bcc: z.string().optional(),
    subject: z.string().min(1, "请填写主题"),
  })
  .strict();

type ComposeFormValues = z.infer<typeof composeFormSchema>;

interface EmailComposeFormProps {
  onClose: () => void;
  onSent?: () => void;
}

export function EmailComposeForm({ onClose, onSent }: EmailComposeFormProps) {
  const canSend = useEmailPermission(EMAIL_PERMISSION.MESSAGE_SEND);
  const [minimize, setMinimize] = useState(false);
  const [maximize, setMaximize] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { quillRef, quill } = useQuill();
  const { register, handleSubmit, formState } = useForm<ComposeFormValues>({
    resolver: zodResolver(composeFormSchema),
  });

  const onSubmit = (values: ComposeFormValues) => {
    if (!canSend) {
      toast.error("无权限发送邮件");
      return;
    }
    const html = quill?.root.innerHTML?.trim() ?? "";
    const text = quill?.getText()?.trim() ?? "";
    const body_html = html === "<p><br></p>" || html === "" ? "" : html;

    const payload = {
      to: parseAddressList(values.to),
      cc: parseAddressList(values.cc ?? ""),
      bcc: parseAddressList(values.bcc ?? ""),
      subject: values.subject.trim(),
      body_html,
      body_text: text || null,
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
        onClose();
        return;
      }
      toast.error(response.error.message);
    });
  };

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
      <CardHeader className="mb-0 block border-none p-0">
        <div className="flex gap-3 rounded-t-md bg-primary/10 px-6 py-3.5">
          <div className="flex-1 text-sm font-medium text-default-900">撰写邮件</div>
          <button type="button" className="flex-none" onClick={handleMinimize}>
            <Minus className="h-5 w-5 text-default-500" />
          </button>
          <button type="button" className="hidden flex-none lg:block" onClick={handleMaximize}>
            <Minimize2 className="h-5 w-5 text-default-500" />
          </button>
          <button type="button" className="flex-none" onClick={onClose}>
            <X className="h-5 w-5 text-default-500" />
          </button>
        </div>
      </CardHeader>
      <CardContent className={cn("px-6", { hidden: minimize })}>
        {!canSend && (
          <p className="mb-4 text-sm text-destructive">当前角色无发信权限。</p>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="to">收件人（多个用逗号或分号分隔）</Label>
            <Input id="to" {...register("to")} disabled={!canSend} />
            {formState.errors.to && (
              <p className="text-xs text-destructive">{formState.errors.to.message}</p>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="cc">抄送</Label>
              <Input id="cc" {...register("cc")} disabled={!canSend} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bcc">密送</Label>
              <Input id="bcc" {...register("bcc")} disabled={!canSend} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="subject">主题</Label>
            <Input id="subject" {...register("subject")} disabled={!canSend} />
            {formState.errors.subject && (
              <p className="text-xs text-destructive">{formState.errors.subject.message}</p>
            )}
          </div>
          <div className="snow-editor h-[250px] border border-default-200" ref={quillRef} />
          <div className="mt-4">
            <Button size="sm" className="min-w-[100px]" disabled={isPending || !canSend}>
              {isPending ? "发送中…" : "发送"}
            </Button>
          </div>
        </form>
      </CardContent>
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
