import type { EmailAccountResponse, TestConnectionResult } from "@portal/shared";
import { create } from "zustand";

interface EmailAccountStoreState {
  /** 工作区内缓存的当前账号（与接口同步，供侧栏摘要等使用） */
  cachedAccount: EmailAccountResponse | null;
  lastConnectionTest: TestConnectionResult | null;
  setCachedAccount: (account: EmailAccountResponse | null) => void;
  setLastConnectionTest: (result: TestConnectionResult | null) => void;
}

export const useEmailAccountStore = create<EmailAccountStoreState>((set) => ({
  cachedAccount: null,
  lastConnectionTest: null,
  setCachedAccount: (account) => set({ cachedAccount: account }),
  setLastConnectionTest: (result) => set({ lastConnectionTest: result }),
}));
