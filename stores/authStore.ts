"use client";

// src/stores/authStore.ts
import { create } from "zustand";
import api from "@/api/axios";
import { EMPTY_STRING } from "@/constants";
import axios from "axios";

type User = {
  id: string;
  username: string;
  // 【要確認】Scala側 CommonRoutes.scala の "me" ハンドラは現状
  //   Map("id" -> session.userId.toString, "username" -> session.userName)
  // しか返しておらず、authorities/roles は含まれていない。
  // そのため roles は常に空配列になり、hasRole(...) は常に false を返す。
  // 画面のロール別出し分けが必要なら、Scala側の /me ハンドラに
  // session.authorities (もしくは role) を含めてもらう必要がある。
  roles: string[];
} | null;

type AuthState = {
  user: User;
  isLoggedIn: () => boolean;
  username: () => string;
  userId: () => string | null;
  hasRole: (role: string) => boolean;
  fetchMe: () => Promise<User>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,

  isLoggedIn: () => !!get().user,
  username: () => get().user?.username ?? EMPTY_STRING,
  userId: () => get().user?.id ?? EMPTY_STRING,
  hasRole: (role) => get().user?.roles?.includes(role) ?? false,

  fetchMe: async () => {
    try {
      // Scala側は { id: string, username: string } を返す(roles無し)。
      const { data } = await api.get<{ id: string; username: string }>("/me");
      const user: User = {
        id: data.id,
        username: data.username,
        roles: [],
      };
      set({ user });
      return user;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        set({ user: null });
        return null;
      }
      throw err;
    }
  },

  logout: async () => {
    await api.post("/logout");
    set({ user: null });
  },

  login: async (username, password) => {
    // 【変更点】CSRF関連の initCsrf() 呼び出しを撤去した(/csrf自体が存在しないため)。
    // Scala側の login ハンドラは req.body.asString を自前でパースしており
    // (parseFormBody)、application/x-www-form-urlencoded 形式の
    // "username=...&password=..." を期待している。axiosはURLSearchParamsを
    //渡すと自動でこのContent-Typeを設定するため、ここは変更不要。
    const body = new URLSearchParams({ username, password });
    const { data } = await api.post<{ message?: string }>("/login", body);
    if (data?.message) {
      localStorage.setItem("redirectMessage", data.message);
    }
    await get().fetchMe();
  },
}));
