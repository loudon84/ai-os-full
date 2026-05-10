"use client";

import { Fragment } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface EmailLabelItem {
  color: string;
  label: string;
  total: string;
}

interface EmailLabelsProps {
  items: EmailLabelItem[];
  isCollapsed: boolean;
}

export function EmailLabels({ items, isCollapsed }: EmailLabelsProps) {
  return (
    <div className={cn("mx-4", { "mx-1 space-y-2 py-2 text-center": isCollapsed })}>
      {items.map((item, index) => (
        <Fragment key={`email-label-${item.label}-${index}`}>
          {isCollapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className={`mx-auto h-3.5 w-3.5 flex-none rounded-full bg-${item.color}`} />
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-4 capitalize">
                <div className="flex-1 text-sm font-medium capitalize text-primary-foreground">
                  {item.label}
                </div>
                <div className="flex-none text-sm font-medium text-primary-foreground">
                  {item.total}
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex cursor-pointer items-center gap-1.5 py-2">
              <div className={`h-2 w-2 flex-none rounded-full bg-${item.color}`} />
              <div className="flex-1 text-sm font-medium capitalize text-default-600">
                {item.label}
              </div>
              <div className="flex-none text-sm font-medium text-default-600">{item.total}</div>
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
}
