import type { EmailMessageResponse } from "@portal/shared";
import { create } from "zustand";

interface EmailStoreState {
  selectedMail: EmailMessageResponse | null;
  searchMail: string;
  setSelectedMail: (mail: EmailMessageResponse | null) => void;
  setSearchMail: (value: string) => void;
}

export const useEmailStore = create<EmailStoreState>((set) => ({
  selectedMail: null,
  searchMail: "",
  setSelectedMail: (mail) => set({ selectedMail: mail }),
  setSearchMail: (value) => set({ searchMail: value }),
}));
