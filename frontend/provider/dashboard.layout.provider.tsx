"use client";
import React from "react";
import Header from "@/components/partials/header";
import Sidebar from "@/components/partials/sidebar";
import { cn } from "@/lib/utils";
import { useSidebar, useThemeStore } from "@/store";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import Footer from "@/components/partials/footer";
import { useMediaQuery } from "@/hooks/use-media-query";
import ThemeCustomize from "@/components/partials/customizer/theme-customizer";
import MobileSidebar from "@/components/partials/sidebar/mobile-sidebar";
import HeaderSearch from "@/components/header-search";
import { useMounted } from "@/hooks/use-mounted";
import { useGlobalCopilotStore } from "@/modules/copilotkit/hooks/useGlobalCopilotStore";
import { COPILOT_SIDEBAR_WIDTH } from "@/modules/copilotkit/components/GlobalCopilotSidebar";
import LayoutLoader from "@/components/layout-loader";
import { WorkspaceFilesPanel } from "@/modules/workspace/components/WorkspaceFilesPanel";
const DashBoardLayoutProvider = ({ children, trans }: { children: React.ReactNode, trans: any }) => {
  const { collapsed, sidebarType, setCollapsed, subMenu } = useSidebar();
  const [open, setOpen] = React.useState(false);
  const { layout } = useThemeStore();
  const location = usePathname();
  const isMobile = useMediaQuery("(min-width: 768px)");
  const mounted = useMounted();
  const copilotOpen = useGlobalCopilotStore((s) => s.open);

  const isDetailView = React.useMemo(() => {
    // “详情页”在现有路由里没有统一约定，这里用保守启发式：
    // - URL 中包含 uuid / 24位hex / 纯数字 这类 id 段时，认为是明细应用视图
    const segs = (location ?? "").split("/").filter(Boolean);
    const looksLikeUuid = (s: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
    const looksLikeHex24 = (s: string) => /^[0-9a-f]{24}$/i.test(s);
    const looksLikeInt = (s: string) => /^\d+$/.test(s);
    return segs.some((s) => looksLikeUuid(s) || looksLikeHex24(s) || looksLikeInt(s));
  }, [location]);

  const prevCollapsedRef = React.useRef<boolean | null>(null);
  React.useEffect(() => {
    // 需求：详情页左侧菜单默认隐藏（此处用“折叠”实现，并在离开详情页时恢复之前状态）
    if (isDetailView) {
      if (prevCollapsedRef.current === null) {
        prevCollapsedRef.current = collapsed;
      }
      if (!collapsed) setCollapsed(true);
      return;
    }

    if (prevCollapsedRef.current !== null && prevCollapsedRef.current !== collapsed) {
      setCollapsed(prevCollapsedRef.current);
    }
    prevCollapsedRef.current = null;
  }, [collapsed, isDetailView, setCollapsed]);

  if (!mounted) {
    return <LayoutLoader />;
  }
  if (layout === "semibox") {
    return (
      <>
        <Header handleOpenSearch={() => setOpen(true)} trans={trans} />
        <Sidebar trans={trans} />

        <div
          className={cn("content-wrapper transition-all duration-150 ", {
            "ltr:xl:ml-[72px] rtl:xl:mr-[72px]": collapsed,
            "ltr:xl:ml-[272px] rtl:xl:mr-[272px]": !collapsed,
          })}
          style={{ marginRight: copilotOpen ? COPILOT_SIDEBAR_WIDTH : 0 }}
        >
          <div
            className={cn(
              "pt-6 pb-8 px-4  page-min-height-semibox ",

            )}
          >
            <div className="semibox-content-wrapper ">
              <LayoutWrapper
                isMobile={isMobile}
                setOpen={setOpen}
                open={open}
                location={location}
                trans={trans}
              >
                {children}
              </LayoutWrapper>
            </div>
          </div>
        </div>
        <Footer handleOpenSearch={() => setOpen(true)} />
        <ThemeCustomize />
      </>
    );
  }
  if (layout === "horizontal") {
    return (
      <>
        <Header handleOpenSearch={() => setOpen(true)} trans={trans} />

        <div className={cn("content-wrapper transition-all duration-150 ")} style={{ marginRight: copilotOpen ? COPILOT_SIDEBAR_WIDTH : 0 }}>
          <div
            className={cn(
              "  pt-0 px-0 pb-0  page-min-height-horizontal ",
              {}
            )}
          >
            <LayoutWrapper
              isMobile={isMobile}
              setOpen={setOpen}
              open={open}
              location={location}
              trans={trans}
            >
              {children}
            </LayoutWrapper>
          </div>
        </div>
        <Footer handleOpenSearch={() => setOpen(true)} />
        <ThemeCustomize />
      </>
    );
  }

  if (sidebarType !== "module") {
    return (
      <>
        <Header handleOpenSearch={() => setOpen(true)} trans={trans} />
        <Sidebar trans={trans} />

        <div
          className={cn("content-wrapper transition-all duration-150 ", {
            "ltr:xl:ml-[248px] rtl:xl:mr-[248px] ": !collapsed,
            "ltr:xl:ml-[72px] rtl:xl:mr-[72px]": collapsed,
          })}
          style={{ marginRight: copilotOpen ? COPILOT_SIDEBAR_WIDTH : 0 }}
        >
          <div
            className={cn(
              "  pt-0 px-0 pb-0  page-min-height ",
              {}
            )}
          >
            {isDetailView ? (
              <div className="flex min-h-[calc(100vh-140px)] overflow-hidden rounded-lg border border-border bg-background">
                <WorkspaceFilesPanel />
                <div className="min-w-0 flex-1 p-6">
                  <LayoutWrapper isMobile={isMobile} setOpen={setOpen} open={open} location={location} trans={trans}>
                    {children}
                  </LayoutWrapper>
                </div>
              </div>
            ) : (
              <LayoutWrapper isMobile={isMobile} setOpen={setOpen} open={open} location={location} trans={trans}>
                {children}
              </LayoutWrapper>
            )}
          </div>
        </div>
        <Footer handleOpenSearch={() => setOpen(true)} />
        <ThemeCustomize />
      </>
    );
  }
  return (
    <>
      <Header handleOpenSearch={() => setOpen(true)} trans={trans} />
      <Sidebar trans={trans} />

      <div
        className={cn("content-wrapper transition-all duration-150 ", {
          "ltr:xl:ml-[300px] rtl:xl:mr-[300px]": !collapsed,
          "ltr:xl:ml-[72px] rtl:xl:mr-[72px]": collapsed,
        })}
        style={{ marginRight: copilotOpen ? COPILOT_SIDEBAR_WIDTH : 0 }}
      >
        <div
          className={cn(
            " layout-padding px-6 pt-6  page-min-height ",

          )}
        >
          {isDetailView ? (
            <div className="flex min-h-[calc(100vh-140px)] overflow-hidden rounded-lg border border-border bg-background">
              <WorkspaceFilesPanel />
              <div className="min-w-0 flex-1 p-6">
                <LayoutWrapper isMobile={isMobile} setOpen={setOpen} open={open} location={location} trans={trans}>
                  {children}
                </LayoutWrapper>
              </div>
            </div>
          ) : (
            <LayoutWrapper isMobile={isMobile} setOpen={setOpen} open={open} location={location} trans={trans}>
              {children}
            </LayoutWrapper>
          )}
        </div>
      </div>
      <Footer handleOpenSearch={() => setOpen(true)} />
      {isMobile && <ThemeCustomize />}
    </>
  );
};

export default DashBoardLayoutProvider;

const LayoutWrapper = ({ children, isMobile, setOpen, open, location, trans }: { children: React.ReactNode, isMobile: boolean, setOpen: any, open: boolean, location: any, trans: any }) => {
  return (
    <>
      <motion.div
        key={location}
        initial="pageInitial"
        animate="pageAnimate"
        exit="pageExit"
        variants={{
          pageInitial: {
            opacity: 0,
            y: 50,
          },
          pageAnimate: {
            opacity: 1,
            y: 0,
          },
          pageExit: {
            opacity: 0,
            y: -50,
          },
        }}
        transition={{
          type: "tween",
          ease: "easeInOut",
          duration: 0.5,
        }}
      >
        <main>{children}</main>
      </motion.div>

      <MobileSidebar trans={trans} className="left-[300px]" />
      <HeaderSearch open={open} setOpen={setOpen} />
    </>
  );
};
