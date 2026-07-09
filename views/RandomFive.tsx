"use client";

// src/views/RandomFive.tsx
import { useState, useEffect, type KeyboardEvent } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Box,
  Card,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import GridViewIcon from "@mui/icons-material/GridView";
import api from "@/api/axios";
import { useFeedbackStore } from "@/stores/feedbackStore";
import bgImage from "@/assets/mainmenu-bg3.webp";
import "./RandomFive.css";
import { extractErrorMessage } from "@/constants";

type Record = { id?: number; nameJp: string; nameKr: string; link: string };

export default function RandomFive() {
  const searchParams = useSearchParams();
  const toast = useFeedbackStore((s) => s.toast);

  const [keyword, setKeyword] = useState("");
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);

  const onRandom = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/hymns/random-retrieve", {
        params: { keyword: keyword.normalize("NFC") },
      });
      setRecords(data);
    } catch (e: unknown) {
      toast(extractErrorMessage(e, "通信エラー"));
    } finally {
      setLoading(false);
    }
  };

  const onNavSearch = async (kw: string) => {
    setLoading(true);
    try {
      const { data } = await api.get("/common/search", {
        params: { keyword: kw.normalize("NFC") },
      });
      setRecords(data);
    } catch (e: unknown) {
      toast(extractErrorMessage(e, "通信エラー"));
    } finally {
      setLoading(false);
    }
  };

  // ナビバーの検索ボックスから ?keyword=xxx 付きで遷移してきた場合、自動検索
  useEffect(() => {
    const q = searchParams.get("keyword");
    if (q) {
      setKeyword(q);
      onNavSearch(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") onRandom();
  };

  return (
    <Box className="page-bg" sx={{ position: "relative", zIndex: 0 }}>
      <Box sx={{ position: "fixed", inset: 0, zIndex: -1 }}>
        <Image
          src={bgImage}
          alt=""
          fill
          priority
          style={{ objectFit: "cover" }}
        />
      </Box>
      <Card className="mt-2 noto-serif randomfive-card" sx={{ mt: 1 }}>
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            color: "#fff",
            bgcolor: "grey.800",
          }}
        >
          <GridViewIcon sx={{ mr: 1 }} />
          <Typography variant="h6">賛美歌ランドム選択</Typography>
        </Box>

        <Box sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <TextField
              sx={{ width: "100%", maxWidth: 480 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="キーワードを入力してください"
              variant="outlined"
              size="small"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon
                        sx={{ cursor: "pointer" }}
                        onClick={onRandom}
                      />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <table className="glass-table">
            <caption>ランドム選択した賛美歌情報一覧</caption>
            <thead>
              <tr className="header-row-mint">
                <th>名称</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr className="body-row-glass">
                  <td style={{ textAlign: "center", padding: "16px 0" }}>
                    <CircularProgress size={24} />
                  </td>
                </tr>
              )}
              {!loading && records.length === 0 && (
                <tr className="body-row-glass">
                  <td style={{ textAlign: "center", padding: "16px 0" }}>
                    該当データなし
                  </td>
                </tr>
              )}
              {!loading &&
                records.map((item) => (
                  <tr key={item.id ?? item.nameJp} className="body-row-glass">
                    <td style={{ textAlign: "center" }}>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="record-link"
                      >
                        {item.nameJp} / {item.nameKr}
                      </a>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Box>
      </Card>
    </Box>
  );
}
