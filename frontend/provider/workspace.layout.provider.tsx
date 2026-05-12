"use client";

import React from "react";
import Header from "@/components/partials/header";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import HeaderSearch from "@/components/header-search";
import { useMounted } from "@/hooks/use-mounted";
import { useGlobalCopilotStore } from "@/modules/copilotkit/hooks/useGlobalCopilotStore";
import { COPILOT_SIDEBAR_WIDTH } from "@/modules/copilotkit/components/GlobalCopilotSidebar";
import LayoutLoader from "@/components/layout-loader";

/**
 * 个人工作台壳层：仅 Header + 主内容 flex 自适应高度（无 Sidebar/Footer）。
 * 全局 Copilot 仍由 app/[lang]/layout.tsx 中的 GlobalCopilotSidebar 提供。
 */
const WorkspaceLayoutProvider = ({
  children,
  trans,
}: {
  children: React.ReactNode;
  trans: unknown;
}) => {
  const [open, setOpen] = React.useState(false);
  const location = usePathname();
  const mounted = useMounted();
  const copilotOpen = useGlobalCopilotStore((s) => s.open);

  if (!mounted) {
    return <LayoutLoader />;
  }

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <Header handleOpenSearch={() => setOpen(true)} trans={trans} />
      </div>
      <main
        className={cn("workspace-layout flex-1 min-h-0 overflow-auto px-1 pt-1 pb-1")}
        style={{ marginRight: copilotOpen ? COPILOT_SIDEBAR_WIDTH : 0 }}
      >
        <motion.div
          key={location}
          initial="pageInitial"
          animate="pageAnimate"
          exit="pageExit"
          variants={{
            pageInitial: { opacity: 0, y: 50 },
            pageAnimate: { opacity: 1, y: 0 },
            pageExit: { opacity: 0, y: -50 },
          }}
          transition={{ type: "tween", ease: "easeInOut", duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>
      <HeaderSearch open={open} setOpen={setOpen} />
    </div>
  );
};

export default WorkspaceLayoutProvider;
