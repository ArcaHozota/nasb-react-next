"use client";

// src/views/ErrorPage.tsx
import { useSearchParams } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { base64ToUtf8 } from "@/constants";

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const encoded = searchParams.get("errMsg");
  const message = encoded
    ? base64ToUtf8(decodeURIComponent(encoded))
    : "不明なエラーが発生しました";

  return (
    <Box sx={{ p: 4, textAlign: "center" }}>
      <Typography variant="h5" color="error" sx={{ mb: 2 }}>
        エラーが発生しました
      </Typography>
      <Typography>{message}</Typography>
    </Box>
  );
}
