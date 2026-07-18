// src/api/axios.ts
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// 【変更点】CSRFトークンの付与・失効時リトライを撤去した。
// 理由: 実際のScala/ZIO側 CommonRoutes.scala には /csrf エンドポイントが
// 存在せず、CSRF対策は SESSION_ID Cookie を
//   isHttpOnly = true, isSecure = true, sameSite = Cookie.SameSite.Strict
// として発行することで代替している。SameSite=Strict は他サイト起点の
// リクエストへ一切Cookieを付与しないため、Spring版で行っていた
// X-XSRF-TOKENのdouble-submit-cookie方式は不要かつ対応するエンドポイントも無い。
//
// 未認証(401)はそのままログイン画面へのリダイレクトに使う。
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
