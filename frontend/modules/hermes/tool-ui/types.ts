import type { HermesToolViewModel } from "../types/tool-view-model";

/** Tool result 到 ViewModel 的映射函数 */
export type ToolResultMapper = (
  toolName: string,
  data: unknown
) => HermesToolViewModel;

/** Adapter 组件的 Props 契约 */
export type ToolUiAdapterProps = {
  model: HermesToolViewModel;
  onInjectContext?: (payload: Record<string, unknown>) => void;
};
