"use client";

import * as React from "react";
import { z } from "zod";

export const userCardPropsSchema = z
  .object({
    avatar: z
      .string()
      .url("请输入有效头像 URL")
      .default("https://avatars.githubusercontent.com/u/9919?v=4"),
    username: z.string().min(1, "用户名必填").default("演示用户"),
    status: z.enum(["online", "offline", "away"]).default("online"),
    bio: z.string().min(1, "简介必填").default("这是一段演示简介。"),
  })
  .describe("UserCard");

export type UserCardProps = z.infer<typeof userCardPropsSchema>;
