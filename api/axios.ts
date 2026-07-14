// src/api/axios.ts
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// CSRFトークンをリクエストヘッダーへ付与(通常パス)
api.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase();
  if (method && ["post", "put", "delete", "patch"].includes(method)) {
    const { csrfToken, csrfHeaderName } = useAuthStore.getState();
    if (csrfToken) {
      config.headers[csrfHeaderName] = csrfToken;
    }
  }
  return config;
});

// CSRFトークン失効時のリトライ(EC2本番環境対応)
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 403 && !err.config._retried) {
      err.config._retried = true;
      await useAuthStore.getState().initCsrf();
      const { csrfToken, csrfHeaderName } = useAuthStore.getState();
      err.config.headers[csrfHeaderName] = csrfToken;
      return api.request(err.config);
    }
    return Promise.reject(err);
  },
);

// 未認証(401)をログイン画面へリダイレクト
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    return Promise.reject(err);
  },
);

export default api;
