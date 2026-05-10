import type { ReactNode } from "react";

/** 侧栏展示用的账号条目（非后端契约） */
export interface EmailAccountView {
  label: string;
  email: string;
  icon: ReactNode;
}

export interface EmailContactView {
  avatar?: { src?: string };
  fullName: string;
  status?: "online" | "offline" | string;
  about?: string;
  chat?: { lastMessage?: string };
}
