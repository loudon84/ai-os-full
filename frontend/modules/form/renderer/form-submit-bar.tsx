"use client";

import { Button } from "@/components/ui/button";

import type { AiOsFormAction } from "../types/form-spec";

export interface FormSubmitBarProps {
  actions: AiOsFormAction[];
  submitting?: boolean;
  onSubmit?: () => void;
  onReset?: () => void;
}

function mapVariant(variant: AiOsFormAction["variant"]): any {
  if (!variant) return "default";
  if (variant === "destructive") return "destructive";
  if (variant === "outline") return "outline";
  if (variant === "secondary") return "secondary";
  return "default";
}

export function FormSubmitBar({ actions, submitting, onSubmit, onReset }: FormSubmitBarProps) {
  return (
    <div className="flex items-center justify-end gap-2 pt-4">
      {actions.map((action) => {
        const isSubmit = action.type === "submit";
        const isReset = action.type === "reset";

        const disabled = submitting && isSubmit;

        return (
          <Button
            key={action.id}
            type={isSubmit ? "button" : "button"}
            variant={mapVariant(action.variant)}
            disabled={disabled}
            onClick={() => {
              if (isSubmit) onSubmit?.();
              if (isReset) onReset?.();
            }}
          >
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}

