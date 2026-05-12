"use client";

import { Fragment, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/modules/auth/stores/auth-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { EmailSettingsDialog } from "@/modules/email/components/email-settings-dialog";

const ProfileInfo = () => {
  const router = useRouter();
  const params = useParams<{ lang?: string }>();
  const lang = typeof params?.lang === "string" ? params.lang : "";
  const workspaceHref = lang ? `/${lang}/workspace` : "/workspace";
  const [emailSettingsOpen, setEmailSettingsOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const displayName = user?.displayName || user?.email || "";
  const email = user?.email ?? "";

  return (
    <Fragment>
      <EmailSettingsDialog open={emailSettingsOpen} onOpenChange={setEmailSettingsOpen} />
      <DropdownMenu>
      <DropdownMenuTrigger asChild className="cursor-pointer">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
            {displayName ? displayName.charAt(0).toUpperCase() : "?"}
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 p-0" align="end">
        <DropdownMenuLabel className="flex gap-2 items-center mb-1 p-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
            {displayName ? displayName.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <div className="text-sm font-medium text-default-800">
              {displayName}
            </div>
            <div className="text-xs text-default-500">{email}</div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <Link href={workspaceHref} className="cursor-pointer">
            <DropdownMenuItem className="flex items-center gap-2 text-sm font-medium text-default-600 px-3 py-1.5 dark:hover:bg-background cursor-pointer">
              <Icon icon="heroicons:squares-2x2" className="w-4 h-4" />
              个人工作台
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem
            className="flex items-center gap-2 text-sm font-medium text-default-600 px-3 py-1.5 dark:hover:bg-background cursor-pointer"
            onSelect={() => setEmailSettingsOpen(true)}
          >
            <Icon icon="heroicons:cog-6-tooth" className="w-4 h-4" />
            邮箱设置
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="mb-0 dark:bg-background" />
        <DropdownMenuItem
          onSelect={async () => { await logout?.(); router.push("/auth/login"); }}
          className="flex items-center gap-2 text-sm font-medium text-default-600 my-1 px-3 dark:hover:bg-background cursor-pointer"
        >
          <Icon icon="heroicons:power" className="w-4 h-4" />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
      </DropdownMenu>
    </Fragment>
  );
};
export default ProfileInfo;
