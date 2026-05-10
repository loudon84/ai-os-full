"use client";

import type { WidgetProps } from "@rjsf/utils";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TextWidget(props: WidgetProps) {
  const value = (props.value ?? "") as string;

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
        value={value}
        placeholder={props.placeholder}
        disabled={props.disabled || props.readonly}
        onChange={(e) => props.onChange(e.target.value)}
        onBlur={() => props.onBlur(props.id, value)}
        onFocus={() => props.onFocus(props.id, value)}
      />
    </div>
  );
}

