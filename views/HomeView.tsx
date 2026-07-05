"use client";

// src/views/HomeView.tsx
import {
  useState,
  useRef,
  useEffect,
  type TouchEvent,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { AxiosError } from "axios";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  useMediaQuery,
  TextField,
  InputAdornment,
  Pagination,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LoginIcon from "@mui/icons-material/Login";
import api from "@/api/axios";
import { useFeedbackStore } from "@/stores/feedbackStore";
import brandLogo from "@/assets/jerusalem-cross2.svg";
import bgImage from "@/assets/home-bg.webp";
import bgImageMobile from "@/assets/home-bg2.webp";
import "./HomeView.css";
import { extractErrorMessage } from "@/constants";

type HymnRecord = {
  id: number;
  nameJp: string;
  nameKr: string;
  link: string;
  lineNumber: "BURGUNDY" | "NAPLES" | "CADMIUM" | string;
};

type PaginationResponse = {
  records: HymnRecord[];
  totalRecords: number;
};

const SWIPE_THRESHOLD = 50;

const lineClass = (line: string) =>
  ({
    BURGUNDY: "is-burgundy",
    NAPLES: "is-naples",
    CADMIUM: "is-cadmium",
  })[line] ?? "";

export default function HomeView() {
  const router = useRouter();
  const toast = useFeedbackStore((s) => s.toast);

  const isMobile = useMediaQuery("(max-width:700px)");
  const PAGE_SIZE = isMobile ? 2 : 5;

  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState(""); // 入力欄の値(即時反映)
  const [submittedKeyword, setSubmittedKeyword] = useState(""); // 検索確定値(クエリキー用)

  // モバイル/デスクトップ切替でページサイズが変わるため1ページ目から取り直す
  // (初回マウント時は実行しない)
  const isMobileMounted = useRef(false);
  useEffect(() => {
    if (!isMobileMounted.current) {
      isMobileMounted.current = true;
      return;
    }
    setPage(1);
  }, [isMobile]);

  const { data, isFetching, error } = useQuery<PaginationResponse>({
    queryKey: ["hymns-pagination", page, PAGE_SIZE, submittedKeyword],
    queryFn: async () => {
      const { data } = await api.get("/hymns/pagination", {
        params: {
          pageNum: page,
          pageSize: PAGE_SIZE,
          keyword: submittedKeyword.normalize("NFC"),
        },
      });
      return data;
    },
    placeholderData: keepPreviousData, // 旧: loading中もDOMを維持しopacity制御、と同じ狙い
  });

  useEffect(() => {
    if (error) {
      const msg =
        (error as AxiosError<string>)?.response?.data ?? "通信エラー";
      toast(msg);
    }
  }, [error, toast]);

  const records = data?.records ?? [];
  const totalRecords = data?.totalRecords ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const currentBg = isMobile ? bgImageMobile : bgImage;

  const onSearch = () => {
    setPage(1);
    setSubmittedKeyword(keyword);
  };

  const onSearchKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") onSearch();
  };

  const downloadScore = async (id: number) => {
    try {
      const res = await api.get(`/hymns/score-download?id=${id}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: unknown) {
      toast(extractErrorMessage(e, "楽譜の取得に失敗しました"));
    }
  };

  const goLogin = () => router.push("/login");
  const reload = () => {
    setPage(1);
    setKeyword("");
    setSubmittedKeyword("");
  };

  // ===== モバイル: 左右スワイプでページ送り =====
  const touchStart = useRef({ x: 0, y: 0 });

  const onTouchStart = (e: TouchEvent) => {
    if (!isMobile) return;
    touchStart.current = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (!isMobile) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;

    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;

    if (dx < 0) goNextPage();
    else goPrevPage();
  };

  const goNextPage = () => {
    if (page >= totalPages) {
      toast("これが最後です");
      return;
    }
    setPage((p) => p + 1);
  };

  const goPrevPage = () => {
    if (page <= 1) {
      toast("これが最初です");
      return;
    }
    setPage((p) => p - 1);
  };

  return (
    <div className="home" style={{ position: "relative", zIndex: 0 }}>
      <div style={{ position: "fixed", inset: 0, zIndex: -1 }}>
        <Image
          src={currentBg}
          alt=""
          fill
          priority
          style={{ objectFit: "cover" }}
        />
      </div>
      <header className="home-nav">
        <div className="home-brand" onClick={reload}>
          <Image src={brandLogo} alt="NASB1995" width={66} height={66} />
          <span className="effect-shine">NASB1995</span>
        </div>
        <button className="login-btn-desktop" onClick={goLogin}>
          <LoginIcon
            fontSize="small"
            sx={{ mr: 0.5, verticalAlign: "middle" }}
          />
          ログイン
        </button>
      </header>

      <main
        className="home-main"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className={`search-row ${isFetching ? "search-loading" : ""}`}>
          <TextField
            fullWidth
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="韓国語単語で検索してください"
            variant="filled"
            hiddenLabel
            sx={{
              bgcolor: "white",
              borderRadius: 999,
              "& .MuiFilledInput-root": { borderRadius: 999 },
            }}
            slotProps={{
              input: {
                disableUnderline: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon sx={{ cursor: "pointer" }} onClick={onSearch} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </div>

        <div className={`card-row ${isFetching ? "card-row--loading" : ""}`}>
          {!isFetching && records.length === 0 && (
            <div className="loading">該当データなし</div>
          )}
          {records.map((item) => (
            <article
              key={item.id}
              className={`glass-card ${lineClass(item.lineNumber)}`}
            >
              <a
                className="song-name"
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.nameJp} / {item.nameKr}
              </a>
              <button
                className="score-btn"
                title="楽譜ダウンロード"
                onClick={() => downloadScore(item.id)}
              >
                &#x1D11E;
              </button>
            </article>
          ))}
        </div>

        {!isMobile && (
          <div className="pager-row pager-row-desktop">
            <span className="page-info">
              {totalPages}ページ中の{page}ページ、{totalRecords}件
            </span>
            <div className="pager-glass">
              <Pagination
                page={page}
                count={totalPages}
                siblingCount={2}
                onChange={(_, value) => setPage(value)}
              />
            </div>
          </div>
        )}

        {isMobile && (
          <p className="hint-verse">
            &ldquo;Heaven and Earth will pass away, but My words will not pass
            away.&rdquo; --- Luke 21:33
          </p>
        )}
      </main>
    </div>
  );
}
