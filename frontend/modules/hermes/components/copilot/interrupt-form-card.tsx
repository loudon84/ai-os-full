/**
 * InterruptFormCard - Form for filling missing fields when interrupted.
 * Provides Resume and Cancel actions.
 */
"use client";

import { useMemo, useState } from "react";
import { useHermesInterrupt } from "../../hooks/use-hermes-interrupt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  onResume: (payload: Record<string, unknown>) => void;
};

export function InterruptFormCard({ onResume }: Props) {
  const { interrupt, clearInterrupt } = useHermesInterrupt();

  const [form, setForm] = useState<Record<string, unknown>>({});

  const fields = useMemo(() => {
    return interrupt.status === "interrupted" ? interrupt.missingFields ?? [] : [];
  }, [interrupt]);

  if (interrupt.status !== "interrupted") return null;

  return (
    <div className="rounded-xl border p-4 space-y-4">
      <div className="font-medium">{interrupt.title}</div>
      <div className="text-sm text-muted-foreground">{interrupt.reason}</div>

      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <Label className="text-sm">{field.label}</Label>

            {field.type === "select" ? (
              <Select
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, [field.key]: val }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {(field.options ?? []).map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type={field.type === "number" ? "number" : "text"}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    [field.key]:
                      field.type === "number" ? Number(e.target.value) : e.target.value,
                  }))
                }
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => {
            onResume(form);
            clearInterrupt();
          }}
        >
          Resume
        </Button>
        <Button variant="outline" onClick={() => clearInterrupt()}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
