"use client";

// src/views/BookAddition.tsx
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Box,
  Card,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import BookIcon from "@mui/icons-material/Book";
import api from "@/api/axios";
import { useFeedbackStore } from "@/stores/feedbackStore";
import bgImage from "@/assets/mainmenu-bg.webp";
import "./BookAddition.css";
import { EMPTY_STRING, extractErrorMessage } from "@/constants";
// 追加import
import { useRef } from "react";
import FormatColorTextIcon from "@mui/icons-material/FormatColorText";
import IconButton from "@mui/material/IconButton";
// import追加
import {
  RedLetterEditor,
  type RedLetterEditorHandle,
} from "@/components/RedLetterEditor";

type BookOrChapter = { id: number; name: string };

const required = (v: string) => !!v && v.trim() !== EMPTY_STRING;

export default function BookAddition() {
  const toast = useFeedbackStore((s) => s.toast);

  const [books, setBooks] = useState<BookOrChapter[]>([]);
  const [chapters, setChapters] = useState<BookOrChapter[]>([]);
  const [bookId, setBookId] = useState<number | string>(EMPTY_STRING);
  const [chapterId, setChapterId] = useState<number | string>(EMPTY_STRING);
  const [phraseId, setPhraseId] = useState(EMPTY_STRING);
  const [textEn, setTextEn] = useState(EMPTY_STRING);
  const [textJp, setTextJp] = useState(EMPTY_STRING);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({
    textEn: false,
    textJp: false,
    phraseId: false,
  });
  // state群のそばに追加
  // refをTextField用からEditor用に変更
  const textEnEditorRef = useRef<RedLetterEditorHandle | null>(null);
  const textJpEditorRef = useRef<RedLetterEditorHandle | null>(null);

  // 初期表示: 書一覧を取得
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/books/get-books");
        setBooks(data);
        if (data.length) setBookId(data[0].id);
      } catch (e: unknown) {
        toast(extractErrorMessage(e, "書の取得に失敗しました"));
      }
    })();
  }, [toast]);

  // 書が変わったら章を取り直す(連動の核心)
  useEffect(() => {
    setChapterId(EMPTY_STRING);
    setChapters([]);
    if (!bookId) return;
    (async () => {
      setChapterLoading(true);
      try {
        const { data } = await api.get("/books/get-chapters", {
          params: { bookId },
        });
        setChapters(data);
        if (data.length) setChapterId(data[0].id);
      } catch (e: unknown) {
        toast(extractErrorMessage(e, "章の取得に失敗しました"));
      } finally {
        setChapterLoading(false);
      }
    })();
  }, [bookId, toast]);

  // 入力中でも該当欄が埋まった時点でアラート(エラー表示)を消す
  const handleTextEnChange = (v: string) => {
    setTextEn(v);
    if (required(v)) setErrors((prev) => ({ ...prev, textEn: false }));
  };

  const handleTextJpChange = (v: string) => {
    setTextJp(v);
    if (required(v)) setErrors((prev) => ({ ...prev, textJp: false }));
  };

  const handlePhraseIdChange = (v: string) => {
    setPhraseId(v);
    if (required(v)) setErrors((prev) => ({ ...prev, phraseId: false }));
  };

  const onStore = async () => {
    const nextErrors = {
      textEn: !required(textEn),
      textJp: !required(textJp),
      phraseId: !required(phraseId),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      toast("入力情報不正");
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.post("/books/info-storage", {
        chapterId,
        id: phraseId.trim(),
        textEn: textEn.trim(),
        textJp: textJp.trim(),
      });
      toast(typeof data === "string" ? data : "追加済み");
      setPhraseId(EMPTY_STRING);
      setTextEn(EMPTY_STRING);
      setTextJp(EMPTY_STRING);
      setErrors({ textEn: false, textJp: false, phraseId: false });
    } catch (e: unknown) {
      toast(extractErrorMessage(e, "保存に失敗しました"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box className="page-bg" sx={{ position: "relative", zIndex: 0 }}>
      <Box sx={{ position: "fixed", inset: 0, zIndex: -1 }}>
        <Image
          src={bgImage}
          alt={EMPTY_STRING}
          fill
          priority
          style={{ objectFit: "cover" }}
        />
      </Box>
      <Card className="mt-2 noto-serif bookaddition-card" sx={{ mt: 1 }}>
        <Box
          className="noto-serif"
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            color: "#fff",
            bgcolor: "grey.800",
          }}
        >
          <MenuBookIcon sx={{ mr: 1 }} />
          <Typography variant="h6">聖書章節入力</Typography>
        </Box>

        <Box sx={{ p: 3 }}>
          <Grid container spacing={2} sx={{ alignItems: "center" }}>
            <Grid size={{ xs: 12, md: 1 }} className="label-text">
              英語
            </Grid>
            <Grid size={{ xs: 12, md: 11 }}>
              <RedLetterEditor
                ref={textEnEditorRef}
                value={textEn}
                onChange={handleTextEnChange}
                error={errors.textEn}
                helperText={
                  errors.textEn
                    ? "上記の入力ボックスを空になってはいけません。"
                    : undefined
                }
              />
            </Grid>
          </Grid>

          <Grid
            container
            spacing={2}
            sx={{ alignItems: "center", mt: 1, mb: 1 }}
          >
            <Grid
              size={{ xs: 12, md: 1 }}
              sx={{ display: "flex", justifyContent: "flex-end" }}
            >
              <IconButton
                color="error"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  textEnEditorRef.current?.wrapSelection();
                  textJpEditorRef.current?.wrapSelection();
                }}
                title="選択範囲を赤文字にする(再押下で解除)"
              >
                <FormatColorTextIcon />
              </IconButton>
            </Grid>
            <Grid size={{ xs: 12, md: 11 }} />
          </Grid>

          <Grid container spacing={2} sx={{ alignItems: "center", mt: 1 }}>
            <Grid size={{ xs: 12, md: 1 }} className="label-text">
              日本語
            </Grid>
            <Grid size={{ xs: 12, md: 11 }}>
              <RedLetterEditor
                ref={textJpEditorRef}
                value={textJp}
                onChange={handleTextJpChange}
                error={errors.textJp}
                helperText={
                  errors.textJp
                    ? "上記の入力ボックスを空になってはいけません。"
                    : undefined
                }
              />
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ alignItems: "flex-start", mt: 3 }}>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small" className="noto-serif">
                <InputLabel>書</InputLabel>
                <Select
                  value={bookId}
                  label="書"
                  onChange={(e) => setBookId(e.target.value as number)}
                >
                  {books.map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      {b.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small" className="noto-serif">
                <InputLabel>章</InputLabel>
                <Select
                  value={chapterId}
                  label="章"
                  onChange={(e) => setChapterId(e.target.value as number)}
                  endAdornment={
                    chapterLoading ? (
                      <CircularProgress size={18} sx={{ mr: 3 }} />
                    ) : null
                  }
                >
                  {chapters.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                value={phraseId}
                onChange={(e) => handlePhraseIdChange(e.target.value)}
                placeholder="節の数を入力しましょう"
                variant="outlined"
                size="small"
                className="noto-serif"
                error={errors.phraseId}
                helperText={
                  errors.phraseId
                    ? "上記の入力ボックスを空になってはいけません。"
                    : EMPTY_STRING
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                className="noto-serif"
                sx={{ height: 40 }}
                disabled={saving}
                onClick={onStore}
              >
                {saving ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  <>
                    <BookIcon sx={{ mr: 0.5 }} fontSize="small" />
                    追加
                  </>
                )}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Card>
    </Box>
  );
}
