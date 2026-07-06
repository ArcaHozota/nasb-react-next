"use client";

// src/stores/authStore.ts
import { create } from "zustand";
import api from "@/api/axios";

type User = {
  id: number;
  username: string;
  roles: string[];
} | null;

type AuthState = {
  user: User;
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

  // Pinia の getters 相当。Zustand では関数として呼ぶ形にする
  isLoggedIn: () => !!get().user,
  username: () => get().user?.username ?? "",
  userId: () => get().user?.id ?? null,
  hasRole: (role) => get().user?.roles?.includes(role) ?? false,

  fetchMe: async () => {
    const { data } = await api.get("/me");
    set({ user: data });
    return data;
  },

  login: async (username, password) => {
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
    await api.get("/csrf");
  },
}));
