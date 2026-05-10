"use client";

import type { WidgetProps } from "@rjsf/utils";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function TextareaWidget(props: WidgetProps) {
  const value = (props.value ?? "") as string;

  return (
    <div className="space-y-2">
      {props.label ? (
        <Label htmlFor={props.id}>
          {props.label}
          {props.required ? <span className="ml-1 text-destructive">*</span> : null}
        </Label>
      ) : null}
      <Textarea
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

