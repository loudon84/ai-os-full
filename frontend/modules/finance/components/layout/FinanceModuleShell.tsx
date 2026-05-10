"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type FinanceModuleShellProps = {
  left?: React.ReactNode;
  center: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
};

export function FinanceModuleShell({
  left,
  center,
  right,
  className,
}: FinanceModuleShellProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [rightSheetOpen, setRightSheetOpen] = useState(false);

  // Mobile layout: left collapses, right goes into Sheet
  if (!isDesktop) {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
        {/* Left sidebar collapses to top area on mobile */}
        {left && (
          <div className="border-b border-border pb-3">{left}</div>
        )}

        {/* Center content takes full width */}
        <div className="flex-1 min-w-0">{center}</div>

        {/* Right panel collapses to a Sheet triggered by button */}
        {right && (
          <div className="fixed bottom-4 right-4 z-50">
            <Sheet open={rightSheetOpen} onOpenChange={setRightSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  上下文面板
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>上下文信息</SheetTitle>
                </SheetHeader>
                <div className="mt-4">{right}</div>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </div>
    );
  }

  // Desktop layout: 3-column (left 240px | center flex-1 | right 320px)
  return (
    <div className={cn("flex gap-6", className)}>
      {left && (
        <aside className="w-60 shrink-0">{left}</aside>
      )}
      <main className="flex-1 min-w-0">{center}</main>
      {right && (
        <aside className="w-80 shrink-0">{right}</aside>
      )}
    </div>
  );
}
