import type { EmailMessageResponse } from "@portal/shared";
import { create } from "zustand";

import { buildQuotedEmailHtml } from "../lib/email-quote";

export type ComposeMode = "new" | "reply" | "replyAll" | "forward" | null;

export type ComposePresentation = "float" | "fullscreen";

export type ComposeDraft = {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  quoteHtml: string;
  inReplyTo: string | null;
  references: string[];
};

interface EmailStoreState {
  selectedMail: EmailMessageResponse | null;
  searchMail: string;
  composeMode: ComposeMode;
  composeDraft: ComposeDraft | null;
  composePresentation: ComposePresentation;
  selectedMessageIds: Set<string>;
  setSelectedMail: (mail: EmailMessageResponse | null) => void;
  setSearchMail: (value: string) => void;
  setComposePresentation: (p: ComposePresentation) => void;
  setComposeMode: (
    mode: ComposeMode,
    sourceMail?: EmailMessageResponse | null,
    opts?: { selfEmail?: string | null },
  ) => void;
  clearCompose: () => void;
  toggleMessageSelection: (messageId: string) => void;
  setMessageSelected: (messageId: string, selected: boolean) => void;
  selectAllMessageIds: (ids: string[]) => void;
  clearMessageSelection: () => void;
}

function uniqueAddresses(addresses: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const a of addresses) {
    const k = a.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(a.trim());
  }
  return out;
}

export const useEmailStore = create<EmailStoreState>((set) => ({
  selectedMail: null,
  searchMail: "",
  composeMode: null,
  composeDraft: null,
  composePresentation: "float",
  selectedMessageIds: new Set<string>(),
  setSelectedMail: (mail) => set({ selectedMail: mail }),
  setSearchMail: (value) => set({ searchMail: value }),
  setComposePresentation: (p) => set({ composePresentation: p }),
  setComposeMode: (mode, sourceMail, opts) => {
    if (mode === null) {
      set({
        composeMode: null,
        composeDraft: null,
        composePresentation: "float",
      });
      return;
    }
    if (mode === "new") {
      set({
        composeMode: "new",
        composeDraft: {
          to: "",
          cc: "",
          bcc: "",
          subject: "",
          quoteHtml: "",
          inReplyTo: null,
          references: [],
        },
      });
      return;
    }
    if (!sourceMail) return;

    const subj = sourceMail.subject ?? "";
    const refChain = [...(sourceMail.references ?? [])];
    if (sourceMail.message_id) refChain.push(sourceMail.message_id);
    const references = refChain.filter(Boolean) as string[];
    const quoteHtml = buildQuotedEmailHtml(sourceMail);

    if (mode === "reply") {
      const to = sourceMail.from?.address ?? "";
      set({
        composeMode: "reply",
        composeDraft: {
          to,
          cc: "",
          bcc: "",
          subject: subj.startsWith("Re:") ? subj : `Re: ${subj}`,
          quoteHtml,
          inReplyTo: sourceMail.message_id,
          references,
        },
      });
      return;
    }

    if (mode === "replyAll") {
      const self = opts?.selfEmail?.trim().toLowerCase() ?? "";
      const fromAddr = sourceMail.from?.address?.trim().toLowerCase() ?? "";
      const to = sourceMail.from?.address ?? "";
      const others: string[] = [];
      for (const list of [sourceMail.to, sourceMail.cc]) {
        for (const a of list) {
          const addr = a.address.trim();
          const low = addr.toLowerCase();
          if (!low || low === self || low === fromAddr) continue;
          others.push(addr);
        }
      }
      const cc = uniqueAddresses(others).join(", ");
      set({
        composeMode: "replyAll",
        composeDraft: {
          to,
          cc,
          bcc: "",
          subject: subj.startsWith("Re:") ? subj : `Re: ${subj}`,
          quoteHtml,
          inReplyTo: sourceMail.message_id,
          references,
        },
      });
      return;
    }

    if (mode === "forward") {
      set({
        composeMode: "forward",
        composeDraft: {
          to: "",
          cc: "",
          bcc: "",
          subject: subj.startsWith("Fwd:") ? subj : `Fwd: ${subj}`,
          quoteHtml,
          inReplyTo: null,
          references: [],
        },
      });
    }
  },
  clearCompose: () =>
    set({
      composeMode: null,
      composeDraft: null,
      composePresentation: "float",
    }),
  toggleMessageSelection: (messageId) =>
    set((s) => {
      const next = new Set(s.selectedMessageIds);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return { selectedMessageIds: next };
    }),
  setMessageSelected: (messageId, selected) =>
    set((s) => {
      const next = new Set(s.selectedMessageIds);
      if (selected) next.add(messageId);
      else next.delete(messageId);
      return { selectedMessageIds: next };
    }),
  selectAllMessageIds: (ids) => set({ selectedMessageIds: new Set(ids) }),
  clearMessageSelection: () => set({ selectedMessageIds: new Set() }),
}));
