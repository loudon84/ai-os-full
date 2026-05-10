"use client";

import type { ComponentType } from "react";
import { useCallback, useMemo } from "react";
import type { z } from "zod";
import * as registryService from "../services/registry";
import { useGenerativeUiStore } from "../stores/generative-ui-store";
import type { RegisteredGenerativeComponentMeta } from "../types";

/**
 * 封装 registry；组件列表随 registryRevision 更新。
 * register(schema, componentCode[, Component]) — 名称取自 schema.description（须设置）。
 */
export function useRegistry() {
  const revision = useGenerativeUiStore((s) => s.registryRevision);
  const storeRegister = useGenerativeUiStore((s) => s.register);

  const components: RegisteredGenerativeComponentMeta[] = useMemo(() => {
    void revision;
    return registryService.listComponents().map(({ name, entry }) => ({
      name,
      schema: entry.schema,
      sandboxSource: entry.sandboxSource,
    }));
  }, [revision]);

  const register = useCallback(
    (
      schema: z.ZodObject<Record<string, z.ZodTypeAny>>,
      componentCode: string,
      Component?: ComponentType<Record<string, unknown>>,
    ) => {
      const name = schema.description;
      if (!name || name.trim() === "") {
        throw new Error("register：请为 schema 设置 .describe('组件名称')");
      }
      const Fallback: ComponentType<Record<string, unknown>> = () => null;
      storeRegister(name, schema, Component ?? Fallback, componentCode);
    },
    [storeRegister],
  );

  const validate = useCallback((name: string, props: unknown) => {
    return registryService.validateComponent(name, props);
  }, []);

  return {
    register,
    validate,
    components,
    revision,
    /** 底层注册（显式名称），供页面初始化演示组件 */
    registerNamed: storeRegister,
  };
}
