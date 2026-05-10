"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const financeNavItems = [
  { href: "/finance", label: "工作台" },
  { href: "/finance/receivable-risk", label: "应收风险" },
  { href: "/finance/cashflow-forecast", label: "现金流预测" },
  { href: "/finance/invoice-anomaly", label: "发票异常" },
  { href: "/finance/reports", label: "报告管理" },
  { href: "/finance/approvals", label: "审批中心" },
];

export function FinanceSidebarNav() {
  const pathname = usePathname();

  return (
    <ScrollArea className="h-full">
      <nav className="flex flex-col gap-1 py-2">
        {financeNavItems.map((item) => {
          const isActive =
            item.href === "/finance"
              ? pathname === "/finance"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md py-1.5 px-3 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Recent Analyses - placeholder */}
      <div className="mt-6 border-t border-border pt-4">
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          最近分析
        </p>
        <div className="mt-2 space-y-1">
          <p className="px-3 py-1.5 text-sm text-muted-foreground">暂无记录</p>
        </div>
      </div>

      {/* Templates - placeholder */}
      <div className="mt-4 border-t border-border pt-4">
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          模板
        </p>
        <div className="mt-2 space-y-1">
          <p className="px-3 py-1.5 text-sm text-muted-foreground">暂无模板</p>
        </div>
      </div>
    </ScrollArea>
  );
}
