import type { ComponentType } from "react";
import type { z } from "zod";

export type RegistryEntry = {
  schema: z.ZodTypeAny;
  component: ComponentType<any>;
  sandboxSource?: string;
};

const registry = new Map<string, RegistryEntry>();

export function registerComponent(
  name: string,
  schema: z.ZodTypeAny,
  component: ComponentType<any>,
  sandboxSource?: string,
): void {
  registry.set(name, { schema, component, sandboxSource });
}

export function validateComponent<T extends z.ZodTypeAny>(
  name: string,
  props: unknown,
): z.infer<T> {
  const entry = registry.get(name);
  if (!entry) {
    throw new Error(`未注册的组件：${name}`);
  }
  return entry.schema.parse(props) as z.infer<T>;
}

export function getComponent(name: string): RegistryEntry | undefined {
  return registry.get(name);
}

export function listComponents(): Array<{ name: string; entry: RegistryEntry }> {
  return Array.from(registry.entries()).map(([name, entry]) => ({ name, entry }));
}

export function unregisterComponent(name: string): boolean {
  return registry.delete(name);
}
