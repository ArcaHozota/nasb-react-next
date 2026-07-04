// src/constants.ts
export const DELAY_APOLOGY = "すみませんが、当機能はまだ実装されておりません";

export const utf8ToBase64 = (str: string): string => {
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
  return btoa(binString);
};

export const base64ToUtf8 = (str: string): string => {
  const binString = atob(str);
  const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

// 例: utils/errorMessage.ts
export const extractErrorMessage = (e: any, fallback: string) => {
  const data = e?.response?.data;
  if (typeof data === "string") return data;
  if (data && typeof data === "object" && "message" in data)
    return data.message;
  return fallback;
};
