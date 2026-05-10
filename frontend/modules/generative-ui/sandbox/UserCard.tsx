"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { UserCardProps } from "./user-card-schema";

function statusLabel(status: UserCardProps["status"]) {
  switch (status) {
    case "online":
      return "在线";
    case "offline":
      return "离线";
    case "away":
      return "离开";
    default:
      return String(status);
  }
}

export function UserCard({
  avatar,
  username,
  status,
  bio,
  className,
}: UserCardProps & { className?: string }) {
  const initial = username.trim().slice(0, 2) || "?";

  return (
    <Card className={cn("max-w-md", className)}>
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <Avatar className="h-14 w-14">
          <AvatarImage src={avatar} alt="" />
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-1">
          <CardTitle className="text-lg">{username}</CardTitle>
          <CardDescription>状态：{statusLabel(status)}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-muted-foreground">{bio}</p>
      </CardContent>
    </Card>
  );
}
