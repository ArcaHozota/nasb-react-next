// src/api/axios.ts
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
});

// CSRFトークンを手動でヘッダーに付与(EC2本番環境対応)
api.interceptors.request.use(async (config) => {
  if (
    config.method &&
    ["post", "put", "delete", "patch"].includes(config.method)
  ) {
    let token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("XSRF-TOKEN="))
      ?.split("=")[1];
    if (!token) {
      const res = await axios.get("/api/csrf");
      token = res.data.token;
    }
    config.headers["X-XSRF-TOKEN"] = token;
  }
  return config;
});

// 未認証(401)をログイン画面へリダイレクト
// router.tsx の RequireAuth 側で拾えるよう、イベント発火に留める
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
