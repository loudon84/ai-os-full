// Generative UI 模块统一导出

export * from "./types";

export { default as GenerativeUIPage } from "./pages/GenerativeUIPage";
export { GenerativeUIWorkspace } from "./components/GenerativeUIWorkspace";

export { SandboxFrame } from "./components/sandbox/SandboxFrame";
export { ComponentPreview } from "./components/sandbox/ComponentPreview";
export { RegistryPanel } from "./components/registry/RegistryPanel";
export { SchemaForm, getSchemaDefaults } from "./components/registry/SchemaForm";
export { EventLogPanel } from "./components/event-log/EventLogPanel";

export { useSandboxRenderer } from "./hooks/use-sandbox-renderer";
export { useRegistry } from "./hooks/use-registry";

export { useGenerativeUiStore } from "./stores/generative-ui-store";

export * as generativeUiRegistry from "./services/registry";
export * as generativeUiSandbox from "./services/sandbox";
export * as generativeUiEvents from "./services/event-protocol";

export { SandboxRenderer } from "./sandbox/SandboxRenderer";
export { UserCard } from "./sandbox/UserCard";
export { userCardPropsSchema } from "./sandbox/user-card-schema";
