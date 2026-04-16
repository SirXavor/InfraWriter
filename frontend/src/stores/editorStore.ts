import { create } from "zustand";
import type { Host } from "../features/hosts/host.types";

interface EditorStore {
  drafts: Record<string, Host>;

  setDraft: (hostId: string, data: Host) => void;
  getDraft: (hostId: string) => Host | undefined;
  clearDraft: (hostId: string) => void;

  hasDraft: (hostId: string) => boolean;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  drafts: {},

  setDraft: (hostId, data) =>
    set((state) => ({
      drafts: {
        ...state.drafts,
        [hostId]: data,
      },
    })),

  getDraft: (hostId) => {
    return get().drafts[hostId];
  },

  clearDraft: (hostId) =>
    set((state) => {
      const newDrafts = { ...state.drafts };
      delete newDrafts[hostId];
      return { drafts: newDrafts };
    }),

    hasDraft: (hostId) => {
      return !!get().drafts[hostId];
    },
}));