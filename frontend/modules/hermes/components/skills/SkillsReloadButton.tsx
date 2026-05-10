"use client";

import { useHermesSkills } from "../../hooks/useHermesSkills";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function SkillsReloadButton() {
  const { reload, isReloading } = useHermesSkills();

  const handleReload = async () => {
    try {
      await reload();
      toast.success("Skills reloaded successfully");
    } catch (err) {
      toast.error("Failed to reload skills", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isReloading}
      onClick={handleReload}
    >
      <RefreshCw className={`mr-1.5 h-4 w-4 ${isReloading ? "animate-spin" : ""}`} />
      {isReloading ? "Reloading..." : "Reload Skills"}
    </Button>
  );
}
