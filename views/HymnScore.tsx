"use client";

// src/views/HymnScore.tsx
import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NextLink from "next/link";
import Image from "next/image";
import {
  Box,
  Card,
  Breadcrumbs,
  Link,
  Typography,
  Button,
  CircularProgress,
  Grid,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import GridViewIcon from "@mui/icons-material/GridView";
import api from "@/api/axios";
import { useFeedbackStore } from "@/stores/feedbackStore";
import bgImage from "@/assets/mainmenu-bg2.webp";
import "./HymnScore.css";
import { extractErrorMessage } from "@/constants";

export default function HymnScore() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useFeedbackStore((s) => s.toast);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scoreId = searchParams.get("scoreId");
  const pageNum = searchParams.get("pageNum") ?? "";
  const pageSize = searchParams.get("pageSize") ?? "";
  const keyword = searchParams.get("keyword") ?? "";

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const buildListQuery = () => {
    const qs = new URLSearchParams();
    if (pageNum) qs.set("pageNum", pageNum);
    if (pageSize) qs.set("pageSize", pageSize);
    if (keyword) qs.set("keyword", keyword);
    return qs.toString();
  };

  const onFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    setError("");
  };

  const onUpload = async () => {
    if (!file) {
      setError("ファイルを選択してください。");
      return;
    }

    const formData = new FormData();
    formData.append("id", scoreId ?? "");
    formData.append("score", file);

    setUploading(true);
    try {
      // multipartはContent-Typeを指定せず、ブラウザにboundary付きで自動設定させる
      const { data } = await api.post("/hymns/score-upload", formData);
      toast(typeof data === "string" ? data : "アップロードしました");
      router.push(`/hymns?${buildListQuery()}`);
    } catch (e: unknown) {
      toast(extractErrorMessage(e, "通信エラーが発生しました。"));
    } finally {
      setUploading(false);
    }
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
        <Link
          component={NextLink}
          href={`/hymns?${buildListQuery()}`}
          underline="hover"
          color="inherit"
        >
          データリスト
        </Link>
        <Typography color="text.primary">楽譜アプロード</Typography>
      </Breadcrumbs>

      <Card className="glass-card">
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            color: "#fff",
            bgcolor: "secondary.dark",
          }}
        >
          <GridViewIcon sx={{ mr: 1 }} />
          <Typography variant="h6">賛美歌楽譜アプロード</Typography>
        </Box>

        <Box sx={{ p: 3 }}>
          <Grid
            container
            spacing={2}
            sx={{ alignItems: "center", justifyContent: "center" }} // ← justifyContent追加
          >
            <Grid
              size={{ xs: 12, sm: "auto" }}
              sx={{ textAlign: { sm: "right" } }}
            >
              楽譜
            </Grid>
            <Grid size={{ xs: 12, sm: "auto" }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.svg"
                onChange={onFilePick}
                style={{ display: "none" }}
              />
              <Button
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                onClick={() => fileInputRef.current?.click()}
              >
                ファイルを選択
              </Button>
              {file && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {file.name}({Math.round(file.size / 1024)} KB)
                </Typography>
              )}
              {error && (
                <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                  {error}
                </Typography>
              )}
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", pb: 2, pr: 2 }}>
          <Button
            variant="contained"
            color="secondary"
            disabled={uploading}
            onClick={onUpload}
          >
            {uploading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              <>
                <CloudUploadIcon sx={{ mr: 0.5 }} fontSize="small" />
                アプロード
              </>
            )}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
