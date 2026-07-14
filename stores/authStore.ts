"use client";

// src/stores/authStore.ts
import { create } from "zustand";
import api from "@/api/axios";
import { EMPTY_STRING } from "@/constants";
import axios from "axios";

type User = {
  id: number;
  username: string;
  roles: string[];
} | null;

type AuthState = {
  user: User;
  csrfToken: string | null; // add this
  csrfHeaderName: string; // add this
  isLoggedIn: () => boolean;
  username: () => string;
  userId: () => number | null;
  hasRole: (role: string) => boolean;
  fetchMe: () => Promise<User>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initCsrf: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  csrfToken: null,
  csrfHeaderName: "X-XSRF-TOKEN", // default Spring header name

  // Pinia の getters 相当。Zustand では関数として呼ぶ形にする
  isLoggedIn: () => !!get().user,
  username: () => get().user?.username ?? EMPTY_STRING,
  userId: () => get().user?.id ?? null,
  hasRole: (role) => get().user?.roles?.includes(role) ?? false,

  fetchMe: async () => {
    try {
      const { data } = await api.get("/me");
      set({ user: data });
      return data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        set({ user: null });
        return null;
      }
      throw err;
    }
  },

  login: async (username, password) => {
    if (!get().csrfToken) {
      await get().initCsrf();
    }
    const body = new URLSearchParams({ username, password });
    const { data } = await api.post("/login", body);
    if (data?.message) {
      localStorage.setItem("redirectMessage", data.message);
    }
    await get().fetchMe();
  },

  logout: async () => {
    await api.post("/logout");
    set({ user: null });
  },

  initCsrf: async () => {
    const { data } = await api.get("/csrf");
    // Spring's CsrfToken JSON shape: { token, headerName, parameterName }
    set({ csrfToken: data.token, csrfHeaderName: data.headerName });
  },
}));
