"use client";

import type { WidgetProps } from "@rjsf/utils";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function parseMoney(value: string) {
  if (value.trim() === "") return undefined;
  const normalized = value.replace(/,/g, "");
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : undefined;
}

export function MoneyWidget(props: WidgetProps) {
  const value = typeof props.value === "number" ? String(props.value) : (props.value ?? "") + "";
  const currency = (props.options as any)?.currency ?? "¥";

  return (
    <div className="space-y-2">
      {props.label ? (
        <Label htmlFor={props.id}>
          {props.label}
          {props.required ? <span className="ml-1 text-destructive">*</span> : null}
        </Label>
      ) : null}
      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground select-none">{currency}</div>
        <Input
          id={props.id}
          name={props.id}
          inputMode="decimal"
          value={value}
          placeholder={props.placeholder}
          disabled={props.disabled || props.readonly}
          onChange={(e) => props.onChange(parseMoney(e.target.value))}
          onBlur={() => props.onBlur(props.id, props.value)}
          onFocus={() => props.onFocus(props.id, props.value)}
        />
      </div>
    </div>
  );
}

