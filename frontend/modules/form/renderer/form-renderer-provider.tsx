"use client";

import { createContext, useContext } from "react";

import type { AiOsFormSpec } from "../types/form-spec";

export interface FormRendererContextValue {
  spec: AiOsFormSpec;
}

const FormRendererContext = createContext<FormRendererContextValue | null>(null);

export function FormRendererProvider({
  value,
  children
}: {
  value: FormRendererContextValue;
  children: React.ReactNode;
}) {
  return <FormRendererContext.Provider value={value}>{children}</FormRendererContext.Provider>;
}

export function useFormRendererContext() {
  const ctx = useContext(FormRendererContext);
  if (!ctx) throw new Error("useFormRendererContext must be used within FormRendererProvider");
  return ctx;
}

