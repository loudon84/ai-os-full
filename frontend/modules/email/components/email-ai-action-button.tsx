"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmailAiActionButton(props: {
  label: string;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  variant?: "outline" | "soft" | "ghost";
  className?: string;
  onClick: () => void | Promise<void>;
}) {
  const { label, icon, loading, disabled, variant = "outline", className, onClick } = props;
  return (
    <Button
      type="button"
      size="sm"
      variant={variant}
      disabled={disabled || loading}
      className={cn("gap-1", className)}
      onClick={() => void onClick()}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      {label}
    </Button>
  );
}
