"use client";

// src/views/LoginView.tsx
import { useState, useEffect, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Alert,
  Button,
  CircularProgress,
} from "@mui/material";
import { useAuthStore } from "@/stores/authStore";
import bgImage from "@/assets/login-bg.webp";

export default function LoginView() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const initCsrf = useAuthStore((s) => s.initCsrf);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 旧 onMounted(() => auth.initCsrf())
  useEffect(() => {
    initCsrf();
  }, [initCsrf]);

  const onLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      router.push("/mainmenu");
    } catch {
      // SecurityConfig の failureHandler が 401 を返す
      setError("ユーザー名またはパスワードが正しくありません。");
    } finally {
      setLoading(false);
    }
  };

  const onEnter = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") onLogin();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <Box sx={{ position: "fixed", inset: 0, zIndex: -1 }}>
        <Image
          src={bgImage}
          alt=""
          fill
          priority
          style={{ objectFit: "cover" }}
        />
      </Box>
      <Card
        sx={{
          width: 360,
          p: 2,
          background: "rgba(255, 255, 255, 0.25)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.45)",
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
          borderRadius: "18px",
        }}
      >
        <CardContent>
          <Typography
            variant="h5"
            align="center"
            sx={{
              fontWeight: 700,
              color: "#fff",
              textShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
              letterSpacing: "0.05em",
              mb: 2,
            }}
          >
            NASB1995
          </Typography>

          <TextField
            fullWidth
            label="ユーザー名"
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="パスワード"
            type="password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onEnter}
            sx={{ mb: 2 }}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={onLogin}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "ログイン"
            )}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
