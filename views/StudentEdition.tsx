"use client";

// src/views/StudentEdition.tsx
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NextLink from "next/link";
import Image from "next/image";
import {
  Box,
  Card,
  Breadcrumbs,
  Link,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  CircularProgress,
} from "@mui/material";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import api from "@/api/axios";
import { useFeedbackStore } from "@/stores/feedbackStore";
import bgImage from "@/assets/mainmenu-bg4.webp";
import "./StudentEdition.css";
import { extractErrorMessage } from "@/constants";

type StudentForm = {
  id: string | null;
  loginAccount: string;
  username: string;
  password: string;
  dateOfBirth: string;
  email: string;
};

const emptyForm: StudentForm = {
  id: null,
  loginAccount: "",
  username: "",
  password: "",
  dateOfBirth: "",
  email: "",
};

const required = (v: string) =>
  !!v && v.trim() !== "" ? "" : "上記の入力ボックスを空になってはいけません。";

const toDateInputValue = (src: string) => {
  if (!src) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(src)) return src;
  const d = new Date(src);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

export default function StudentEdition() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useFeedbackStore((s) => s.toast);

  const userId = searchParams.get("userId");
  const [form, setForm] = useState<StudentForm>({ ...emptyForm, id: userId });
  const [errors, setErrors] = useState({
    loginAccount: "",
    username: "",
    password: "",
    dateOfBirth: "",
    email: "",
  });
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const setField = <K extends keyof StudentForm>(
    key: K,
    value: StudentForm[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const fetchInitial = async () => {
    if (!form.id) return;
    try {
      const { data } = await api.get("/students/initial", {
        params: { editId: form.id },
      });
      setForm((f) => ({
        ...f,
        loginAccount: data.loginAccount,
        username: data.username,
        password: data.password,
        dateOfBirth: toDateInputValue(data.dateOfBirth),
        email: data.email,
      }));
    } catch (e: unknown) {
      toast(extractErrorMessage(e, "データの取得に失敗しました"));
    }
  };

  useEffect(() => {
    fetchInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAccount = async () => {
    setErrors((er) => ({ ...er, loginAccount: "" }));
    const name = form.loginAccount.trim();
    if (!name) return;
    try {
      await api.get("/students/check-duplicated", {
        params: { id: form.id ?? "", loginAccount: name },
      });
    } catch (e: unknown) {
      setErrors((er) => ({
        ...er,
        loginAccount: extractErrorMessage(
          e,
          "このアカウントは既に使われています。",
        ),
      }));
    }
  };

  const onUpdate = async () => {
    const nextErrors = {
      loginAccount: required(form.loginAccount) || errors.loginAccount,
      username: required(form.username),
      password: required(form.password),
      dateOfBirth: required(form.dateOfBirth),
      email: required(form.email),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      toast("入力情報不正");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put("/students/info-update", {
        id: form.id,
        loginAccount: form.loginAccount.trim(),
        username: form.username.trim(),
        password: form.password,
        email: form.email,
        dateOfBirth: form.dateOfBirth,
      });
      toast(typeof data === "string" ? data : "更新しました");
      router.push("/mainmenu");
    } catch (e: unknown) {
      toast(extractErrorMessage(e, "更新に失敗しました"));
    } finally {
      setSaving(false);
    }
  };

  const onRestore = async () => {
    setErrors({
      loginAccount: "",
      username: "",
      password: "",
      dateOfBirth: "",
      email: "",
    });
    if (!form.id) {
      setForm({ ...emptyForm });
      return;
    }
    await fetchInitial();
  };

  return (
    <Box className="page-bg noto-sans" sx={{ position: "relative", zIndex: 0 }}>
      <Box sx={{ position: "fixed", inset: 0, zIndex: -1 }}>
        <Image
          src={bgImage}
          alt=""
          fill
          priority
          style={{ objectFit: "cover" }}
        />
      </Box>
      <Breadcrumbs className="page-breadcrumb" sx={{ px: 0, mb: 1 }}>
        <Link
          component={NextLink}
          href="/mainmenu"
          underline="hover"
          color="inherit"
        >
          メインメニュー
        </Link>
        <Typography color="text.primary">データリスト</Typography>
        <Typography color="text.primary">データ更新</Typography>
      </Breadcrumbs>

      <Card className="glass-card">
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            color: "#fff",
            bgcolor: "#ff883e",
          }}
        >
          <AccountBoxIcon sx={{ mr: 1 }} />
          <Typography variant="h6">ユーザー情報更新</Typography>
        </Box>

        <Box sx={{ p: 3 }}>
          <Box sx={{ mb: 2.5 }}>
            <div className="form-label">アカウント</div>
            <TextField
              fullWidth
              value={form.loginAccount}
              onChange={(e) => setField("loginAccount", e.target.value)}
              onBlur={checkAccount}
              placeholder="アカウントを入力してください"
              variant="outlined"
              size="small"
              error={!!errors.loginAccount}
              helperText={errors.loginAccount}
            />
          </Box>

          <Box sx={{ mb: 2.5 }}>
            <div className="form-label">名称</div>
            <TextField
              fullWidth
              value={form.username}
              onChange={(e) => setField("username", e.target.value)}
              placeholder="名称を入力してください"
              variant="outlined"
              size="small"
              error={!!errors.username}
              helperText={errors.username}
            />
          </Box>

          <Box sx={{ mb: 2.5 }}>
            <div className="form-label">パスワード</div>
            <TextField
              fullWidth
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              placeholder="パスワードを入力してください"
              variant="outlined"
              size="small"
              error={!!errors.password}
              helperText={errors.password}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <Box sx={{ mb: 2.5 }}>
            <div className="form-label">生年月日</div>
            <TextField
              fullWidth
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setField("dateOfBirth", e.target.value)}
              variant="outlined"
              size="small"
              error={!!errors.dateOfBirth}
              helperText={errors.dateOfBirth}
            />
          </Box>

          <Box sx={{ mb: 2.5 }}>
            <div className="form-label">メール</div>
            <TextField
              fullWidth
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="メールを入力してください"
              variant="outlined"
              size="small"
              error={!!errors.email}
              helperText={errors.email}
            />
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
            pb: 2,
            pr: 2,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            disabled={saving}
            onClick={onUpdate}
          >
            {saving ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              <>
                <FlashOnIcon sx={{ mr: 0.5 }} fontSize="small" />
                更新
              </>
            )}
          </Button>
          <Button variant="contained" color="inherit" onClick={onRestore}>
            <DeleteOutlineIcon sx={{ mr: 0.5 }} fontSize="small" />
            廃棄
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
