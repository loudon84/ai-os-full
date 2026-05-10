"use client";

import type { WidgetProps } from "@rjsf/utils";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function CheckboxWidget(props: WidgetProps) {
  const checked = Boolean(props.value);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Checkbox
          id={props.id}
          checked={checked}
          disabled={props.disabled || props.readonly}
          onCheckedChange={(next) => props.onChange(Boolean(next))}
        />
        {props.label ? (
          <Label htmlFor={props.id}>
            {props.label}
            {props.required ? <span className="ml-1 text-destructive">*</span> : null}
          </Label>
        ) : null}
      </div>
    </div>
  );
}

