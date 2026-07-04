"use client";

// src/stores/feedbackStore.ts
import { create } from "zustand";

type SnackbarState = {
  show: boolean;
  text: string;
};

type DialogState = {
  show: boolean;
  title: string;
  text: string;
  resolve: ((ok: boolean) => void) | null;
};

type FeedbackState = {
  snackbar: SnackbarState;
  dialog: DialogState;
  toast: (text: string) => void;
  confirm: (text: string, title?: string) => Promise<boolean>;
  answer: (ok: boolean) => void;
  closeSnackbar: () => void;
};

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  snackbar: { show: false, text: "" },
  dialog: { show: false, title: "確認", text: "", resolve: null },

  // 旧 layer.msg(トースト)相当
  toast: (text) => {
    set({ snackbar: { show: true, text } });
  },

  closeSnackbar: () => {
    set((state) => ({ snackbar: { ...state.snackbar, show: false } }));
  },

  // 旧 Swal.fire の confirm 相当。await confirm('...') で true/false が返る
  confirm: (text, title = "確認") =>
    new Promise<boolean>((resolve) => {
      set({ dialog: { show: true, title, text, resolve } });
    }),

  answer: (ok) => {
    const { dialog } = get();
    dialog.resolve?.(ok);
    set({ dialog: { show: false, title: "確認", text: "", resolve: null } });
  },
}));
