"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { EmailSettingsPanel } from "@/modules/email/components/email-settings-panel";

export default function EmailSettingsRoutePage() {
  const params = useParams<{ lang?: string }>();
  const lang = typeof params?.lang === "string" ? params.lang : "";
  const emailHref = lang ? `/${lang}/email` : "/email";

  return (
    <div className="min-h-0">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon icon="heroicons:cog-6-tooth" className="h-6 w-6 text-default-500" />
            <h1 className="text-2xl font-semibold text-default-900">邮箱设置</h1>
          </div>
          <Link
            href={emailHref}
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Icon icon="heroicons:arrow-left" className="h-4 w-4" />
            返回邮箱工作台
          </Link>
        </div>
        <EmailSettingsPanel />
      </div>
    </div>
  );
}
