"use client";

import type { WidgetProps } from "@rjsf/utils";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function RadioWidget(props: WidgetProps) {
  const value = (props.value ?? "") as string;
  const enumOptions = props.options.enumOptions ?? [];

  return (
    <div className="space-y-2">
      {props.label ? (
        <Label>
          {props.label}
          {props.required ? <span className="ml-1 text-destructive">*</span> : null}
        </Label>
      ) : null}
      <RadioGroup
        value={value}
        onValueChange={(next) => props.onChange(next)}
        disabled={props.disabled || props.readonly}
      >
        {enumOptions.map((opt) => (
          <RadioGroupItem key={String(opt.value)} value={String(opt.value)} id={`${props.id}-${opt.value}`}>
            {String(opt.label ?? opt.value)}
          </RadioGroupItem>
        ))}
      </RadioGroup>
    </div>
  );
}

