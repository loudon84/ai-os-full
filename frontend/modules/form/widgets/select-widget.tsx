"use client";

import type { WidgetProps } from "@rjsf/utils";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SelectWidget(props: WidgetProps) {
  const value = (props.value ?? "") as string;
  const enumOptions = props.options.enumOptions ?? [];

  return (
    <div className="space-y-2">
      {props.label ? (
        <Label htmlFor={props.id}>
          {props.label}
          {props.required ? <span className="ml-1 text-destructive">*</span> : null}
        </Label>
      ) : null}
      <Select
        value={value}
        onValueChange={(next) => props.onChange(next)}
        disabled={props.disabled || props.readonly}
      >
        <SelectTrigger id={props.id} aria-label={props.label}>
          <SelectValue placeholder={props.placeholder ?? "请选择"} />
        </SelectTrigger>
        <SelectContent>
          {enumOptions.map((opt) => (
            <SelectItem key={String(opt.value)} value={String(opt.value)}>
              {String(opt.label ?? opt.value)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

