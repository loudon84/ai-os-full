"use client";

import type { WidgetProps } from "@rjsf/utils";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function toNumber(value: string, isInteger: boolean) {
  if (value.trim() === "") return undefined;
  const n = isInteger ? Number.parseInt(value, 10) : Number.parseFloat(value);
  return Number.isFinite(n) ? n : undefined;
}

export function NumberWidget(props: WidgetProps) {
  const schemaType = (props.schema as any)?.type;
  const isInteger = schemaType === "integer";

  const value = typeof props.value === "number" ? String(props.value) : (props.value ?? "") + "";

  return (
    <div className="space-y-2">
      {props.label ? (
        <Label htmlFor={props.id}>
          {props.label}
          {props.required ? <span className="ml-1 text-destructive">*</span> : null}
        </Label>
      ) : null}
      <Input
        id={props.id}
        name={props.id}
        type="number"
        inputMode="decimal"
        value={value}
        placeholder={props.placeholder}
        disabled={props.disabled || props.readonly}
        onChange={(e) => props.onChange(toNumber(e.target.value, isInteger))}
        onBlur={() => props.onBlur(props.id, props.value)}
        onFocus={() => props.onFocus(props.id, props.value)}
      />
    </div>
  );
}

