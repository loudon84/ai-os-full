import { notFound } from "next/navigation";
import { HermesModuleShell } from "@/modules/hermes/components/layout/HermesModuleShell";

export default function HermesDevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <HermesModuleShell
      title="Hermes Dev Preview"
      description="Tool UI 开发调试工作台"
      actions={
        <span className="rounded bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
          DEV ONLY
        </span>
      }
    >
      {children}
    </HermesModuleShell>
  );
}

