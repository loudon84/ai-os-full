"use client";

import { CalendarIcon } from "lucide-react";
import type { WidgetProps } from "@rjsf/utils";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function toDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || !value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function DateWidget(props: WidgetProps) {
  const date = toDate(props.value);
  const disabled = props.disabled || props.readonly;

  return (
    <div className="space-y-2">
      {props.label ? (
        <Label>
          {props.label}
          {props.required ? <span className="ml-1 text-destructive">*</span> : null}
        </Label>
      ) : null}
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="justify-start gap-2" disabled={disabled}>
            <CalendarIcon className="h-4 w-4" />
            {date ? format(date, "yyyy-MM-dd") : <span className="text-muted-foreground">选择日期</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              if (!d) return;
              props.onChange(toIsoDate(d));
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

