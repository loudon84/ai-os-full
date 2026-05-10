"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SHORTCUTS = [
  { key: "Alt + 1", description: "Switch to Finance domain" },
  { key: "Alt + 2", description: "Switch to Risk domain" },
  { key: "Alt + 3", description: "Switch to Forecast domain" },
  { key: "Alt + ↓", description: "Next scenario" },
  { key: "Alt + ↑", description: "Previous scenario" },
  { key: "Alt + M", description: "Cycle mode (mock → fixture → live)" },
  { key: "Alt + J", description: "Toggle JSON panel" },
  { key: "Alt + C", description: "Toggle Context panel" },
  { key: "Alt + S", description: "Toggle Schema panel" },
  { key: "Alt + R", description: "Reset all state" },
  { key: "?", description: "Toggle this cheatsheet" },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function PreviewShortcutCheatsheet({ open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          {SHORTCUTS.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm"
            >
              <span className="text-muted-foreground">{s.description}</span>
              <kbd className="rounded border bg-muted px-2 py-0.5 font-mono text-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
