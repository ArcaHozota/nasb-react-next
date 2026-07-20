"use client";

// src/views/HymnForm.tsx
import { useState, useRef, useEffect, type FocusEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NextLink from "next/link";
import Image from "next/image";
import {
  Box,
  Card,
  CardContent,
  Breadcrumbs,
  Link,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  CircularProgress,
} from "@mui/material";
import GridViewIcon from "@mui/icons-material/GridView";
import api from "@/api/axios";
import { useFeedbackStore } from "@/stores/feedbackStore";
import { useAuthStore } from "@/stores/authStore";
import bgImage from "@/assets/mainmenu-bg5.webp";
import "./HymnForm.css";
import { EMPTY_STRING, extractErrorMessage } from "@/constants";

type FormState = {
  id: string | null;
  nameJp: string;
  nameKr: string;
  link: string;
  lyric: string;
  classic: boolean;
  updatedTime: string;
  updatedUser: string;
};

const emptyForm: FormState = {
  id: null,
  nameJp: EMPTY_STRING,
  nameKr: EMPTY_STRING,
  link: EMPTY_STRING,
  lyric: EMPTY_STRING,
  classic: false,
  updatedTime: EMPTY_STRING,
  updatedUser: EMPTY_STRING,
};

// バックエンドの { status, message } / 旧仕様の文字列レスポンス、両対応
// const extractErrorMessage = (e: any, fallback: string) => {
//   const data = e?.response?.data;
//   if (!data) return fallback;
//   if (typeof data === "string") return data;
//   if (typeof data === "object" && data.message) return data.message;
//   return fallback;
// };

const required = (v: string) =>
  !!v && v.trim() !== EMPTY_STRING
    ? EMPTY_STRING
    : "上記の入力ボックスを空になってはいけません。";

export default function HymnForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useFeedbackStore((s) => s.toast);
  const userId = useAuthStore((s) => s.userId);

  const editId = searchParams.get("editId");
  const isEdit = !!editId;
  const pageNum = searchParams.get("pageNum") ?? EMPTY_STRING;
  const pageSize = searchParams.get("pageSize") ?? EMPTY_STRING;
  const keyword = searchParams.get("keyword") ?? EMPTY_STRING;

  const [form, setForm] = useState<FormState>({ ...emptyForm, id: editId });
  const [errors, setErrors] = useState({
    nameJp: EMPTY_STRING,
    nameKr: EMPTY_STRING,
    link: EMPTY_STRING,
    lyric: EMPTY_STRING,
  });
  const [saving, setSaving] = useState(false);
  const originalForm = useRef<FormState | null>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // 編集時: 既存データをロード
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const { data } = await api.get("/hymns/get-info-id", {
          params: { hymnId: editId },
        });
        setForm((f) => ({ ...f, ...data }));
        originalForm.current = { ...form, ...data };
      } catch (e) {
        toast(extractErrorMessage(e, "データの取得に失敗しました"));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, editId]);

  const checkNameJp = async (e: FocusEvent<HTMLInputElement>) => {
    const name = e.target.value.trim();
    setErrors((er) => ({ ...er, nameJp: EMPTY_STRING }));
    if (!name) return;
    try {
      await api.get("/hymns/check-duplicated", {
        params: { id: form.id ?? EMPTY_STRING, nameJp: name },
      });
    } catch (e) {
      setErrors((er) => ({
        ...er,
        nameJp: extractErrorMessage(e, "この名称は既に使われています。"),
      }));
    }
  };

  const checkNameKr = async (e: FocusEvent<HTMLInputElement>) => {
    const name = e.target.value.trim().normalize("NFC");
    setErrors((er) => ({ ...er, nameKr: EMPTY_STRING }));
    if (!name) return;
    try {
      await api.get("/hymns/check-duplicated2", {
        params: { id: form.id ?? EMPTY_STRING, nameKr: name },
      });
    } catch (e) {
      setErrors((er) => ({
        ...er,
        nameKr: extractErrorMessage(e, "この名称は既に使われています。"),
      }));
    }
  };

  const buildListQuery = () => {
    const qs = new URLSearchParams();
    if (pageNum) qs.set("pageNum", pageNum);
    if (pageSize) qs.set("pageSize", pageSize);
    if (keyword) qs.set("keyword", keyword);
    return qs.toString();
  };

  const onSubmit = async () => {
    const nextErrors = {
      nameJp: required(form.nameJp) || errors.nameJp,
      nameKr: required(form.nameKr) || errors.nameKr,
      link: required(form.link),
      lyric: required(form.lyric),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      toast("入力情報不正");
      return;
    }
    const uid = userId();
    if (!uid) {
      toast("ログイン情報の取得に失敗しました。再度ログインしてください。");
      return;
    }
    setSaving(true);
    const payload = {
      nameJp: form.nameJp.trim(),
      nameKr: form.nameKr.trim().normalize("NFC"),
      link: form.link,
      lyric: form.lyric,
      classic: form.classic,
      updatedUser: uid,
    };
    try {
      if (isEdit) {
        const updatePayload = {
          ...payload,
          id: form.id,
          updatedTime: form.updatedTime,
        };
        const { data } = await api.put("/hymns/info-update", updatePayload);
        toast(typeof data === "string" ? data : "更新しました");
        router.push(`/hymns?${buildListQuery()}`);
      } else {
        const { data } = await api.post("/hymns/info-storage", payload, {
          params: { pageSize: pageSize || 5 },
        });
        toast("追加済み");
        const qs = new URLSearchParams();
        qs.set("pageNum", data);
        if (pageSize) qs.set("pageSize", pageSize);
        router.push(`/hymns?${qs.toString()}`);
      }
    } catch (e) {
      toast(extractErrorMessage(e, "保存に失敗しました"));
    } finally {
      setSaving(false);
    }
  };

  const onReset = () => {
    if (isEdit && originalForm.current) {
      setForm(originalForm.current);
    } else {
      setForm({ ...emptyForm, id: editId });
    }
    setErrors({
      nameJp: EMPTY_STRING,
      nameKr: EMPTY_STRING,
      link: EMPTY_STRING,
      lyric: EMPTY_STRING,
    });
  };

  return (
    <Box className="page-bg noto-sans" sx={{ position: "relative", zIndex: 0 }}>
      <Box sx={{ position: "fixed", inset: 0, zIndex: -1 }}>
        <Image
          src={bgImage}
          alt={EMPTY_STRING}
          fill
          priority
          style={{ objectFit: "cover" }}
        />
      </Box>
      <Breadcrumbs className="page-breadcrumb" sx={{ px: 0, color: "#fffff0" }}>
        <Link
          component={NextLink}
          href="/mainmenu"
          underline="hover"
          sx={{ color: "#fffff0" }}
        >
          メインメニュー
        </Link>
        <Link
          component={NextLink}
          href={`/hymns?${buildListQuery()}`}
          underline="hover"
          sx={{ color: "#fffff0" }}
        >
          データリスト
        </Link>
        <Typography sx={{ color: "#fffff0" }}>
          {isEdit ? "データ更新" : "データ追加"}
        </Typography>
      </Breadcrumbs>

      <Card className={`form-card${isEdit ? " is-edit" : EMPTY_STRING}`}>
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            color: "#fff",
            bgcolor: isEdit ? "primary.dark" : "success.dark",
          }}
        >
          <GridViewIcon sx={{ mr: 1 }} />
          <Typography variant="h6">
            {isEdit ? "賛美歌情報更新" : "賛美歌情報追加"}
          </Typography>
        </Box>

        <CardContent sx={{ pt: 3 }}>
          <Box sx={{ mb: 2.5 }}>
            <div className="form-label">日本語名称</div>
            <TextField
              fullWidth
              value={form.nameJp}
              onChange={(e) => setField("nameJp", e.target.value)}
              onBlur={checkNameJp}
              placeholder="日本語名称を入力してください"
              variant="outlined"
              size="small"
              color={isEdit ? "primary" : "success"}
              error={!!errors.nameJp}
              helperText={errors.nameJp}
            />
          </Box>

          <Box sx={{ mb: 2.5 }}>
            <div className="form-label">韓国語名称</div>
            <TextField
              fullWidth
              value={form.nameKr}
              onChange={(e) => setField("nameKr", e.target.value)}
              onBlur={checkNameKr}
              placeholder="韓国語名称を入力してください"
              variant="outlined"
              size="small"
              color={isEdit ? "primary" : "success"}
              error={!!errors.nameKr}
              helperText={errors.nameKr}
            />
          </Box>

          <Box className="link-row" sx={{ mb: 2.5 }}>
            <div className="link-field">
              <div className="form-label">リンク</div>
              <TextField
                fullWidth
                value={form.link}
                onChange={(e) => setField("link", e.target.value)}
                placeholder="リンクを入力してください"
                variant="outlined"
                size="small"
                color={isEdit ? "primary" : "success"}
                error={!!errors.link}
                helperText={errors.link}
              />
            </div>
            <div className="classic-field">
              <div className="form-label">クラシック</div>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.classic}
                    onChange={(e) => setField("classic", e.target.checked)}
                    color={isEdit ? "primary" : "success"}
                  />
                }
                label={EMPTY_STRING}
              />
            </div>
          </Box>

          <Box sx={{ mb: 2.5 }}>
            <div className="form-label">歌詞</div>
            <TextField
              fullWidth
              multiline
              rows={6}
              value={form.lyric}
              onChange={(e) => setField("lyric", e.target.value)}
              placeholder="セリフを入力してください"
              variant="outlined"
              color={isEdit ? "primary" : "success"}
              error={!!errors.lyric}
              helperText={errors.lyric}
            />
          </Box>

          {isEdit && (
            <Typography variant="caption" color="text.secondary">
              最終更新者：{form.updatedUser}＠{form.updatedTime}日本標準時間
            </Typography>
          )}
        </CardContent>

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
            color={isEdit ? "primary" : "success"}
            disabled={saving}
            onClick={onSubmit}
          >
            {saving ? (
              <CircularProgress size={22} color="inherit" />
            ) : isEdit ? (
              "更新"
            ) : (
              "追加"
            )}
          </Button>
          <Button variant="contained" color="inherit" onClick={onReset}>
            {isEdit ? "廃棄" : "リセット"}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
