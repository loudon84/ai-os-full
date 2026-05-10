import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusPillProps = {
  status: string;
  label: string;
  variant?: "soft" | "solid";
};

/** Maps common finance statuses to badge color variants */
function resolveStatusColor(
  status: string
): "secondary" | "info" | "default" | "destructive" {
  const statusMap: Record<string, "secondary" | "info" | "default" | "destructive"> = {
    draft: "secondary",
    unprocessed: "secondary",
    pending_approval: "info",
    pending: "info",
    under_review: "info",
    approved: "default",
    confirmed: "default",
    success: "default",
    rejected: "destructive",
    escalated: "destructive",
    failed: "destructive",
    ignored: "secondary",
  };
  return statusMap[status] ?? "secondary";
}

export function StatusPill({ status, label, variant = "soft" }: StatusPillProps) {
  const color = resolveStatusColor(status);

  return (
    <Badge
      color={color}
      variant={variant === "soft" ? "soft" : undefined}
      className={cn(variant === "solid" && "bg-opacity-100")}
    >
      {label}
    </Badge>
  );
}
