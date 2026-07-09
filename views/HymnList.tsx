"use client";

// src/views/HymnList.tsx
import { useState, useMemo, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  useQuery,
  keepPreviousData,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Box,
  Card,
  Grid,
  TextField,
  InputAdornment,
  Button,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
} from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import GridViewIcon from "@mui/icons-material/GridView";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import api from "@/api/axios";
import { useFeedbackStore } from "@/stores/feedbackStore";
import { extractErrorMessage, utf8ToBase64 } from "@/constants";
import bgImage from "@/assets/mainmenu-bg2.webp";
import "./HymnList.css";

type HymnRow = {
  id: number;
  nameJp: string;
  nameKr: string;
  link: string;
  lineNumber: string;
};

const textSizeClass = (str: string) => {
  const len = (str ?? "").length;
  if (len >= 33) return "text-xs";
  if (len >= 19) return "text-sm";
  return "";
};

const rowClass = (line: string) =>
  ({
    BURGUNDY: "row-burgundy",
    NAPLES: "row-naples",
    CADMIUM: "row-cadmium",
  })[line] ?? "";

export default function HymnList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useFeedbackStore((s) => s.toast);
  const confirm = useFeedbackStore((s) => s.confirm);
  const queryClient = useQueryClient();

  const [page, setPage] = useState(Number(searchParams.get("pageNum")) || 1);
  const [pageSize, setPageSize] = useState(
    Number(searchParams.get("pageSize")) || 10,
  );
  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [submittedKeyword, setSubmittedKeyword] = useState(
    searchParams.get("keyword") ?? "",
  );

  const { data, isFetching } = useQuery({
    queryKey: ["hymns-list", page, pageSize, submittedKeyword],
    queryFn: async () => {
      const { data } = await api.get("/hymns/pagination", {
        params: {
          pageNum: page,
          pageSize,
          keyword: submittedKeyword.normalize("NFC"),
        },
      });
      return data as { records: HymnRow[]; totalRecords: number };
    },
    placeholderData: keepPreviousData,
  });

  const records = data?.records ?? [];
  const totalRecords = data?.totalRecords ?? 0;

  const onSearch = () => {
    setPage(1);
    setSubmittedKeyword(keyword);
  };

  const onSearchKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") onSearch();
  };

  const goAdd = () =>
    router.push(`/hymns/add?pageNum=${page}&pageSize=${pageSize}`);

  const goEdit = (id: number) =>
    router.push(
      `/hymns/edit?editId=${id}&pageNum=${page}&pageSize=${pageSize}&keyword=${encodeURIComponent(submittedKeyword)}`,
    );

  const goScore = (id: number) =>
    router.push(
      `/hymns/score?scoreId=${id}&pageNum=${page}&pageSize=${pageSize}&keyword=${encodeURIComponent(submittedKeyword)}`,
    );

  const onDelete = async (item: HymnRow) => {
    try {
      await api.get(`/hymns/delete-check?id=${item.id}`);
    } catch (e: unknown) {
      toast(extractErrorMessage(e, "削除できません"));
      return;
    }
    const ok = await confirm(
      `この「${item.nameJp}」という歌の情報を削除するとよろしいでしょうか。`,
      "メッセージ",
    );
    if (!ok) return;
    try {
      const { data } = await api.delete(`/hymns/info-delete?id=${item.id}`);
      toast(data.message ?? "削除しました");
      queryClient.invalidateQueries({ queryKey: ["hymns-list"] });
    } catch (e: unknown) {
      toast(extractErrorMessage(e, "削除に失敗しました"));
    }
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
      const msg = extractErrorMessage(e, "楽譜の取得に失敗しました");
      router.push(`/error?errMsg=${encodeURIComponent(utf8ToBase64(msg))}`);
    }
  };

  const columns: GridColDef<HymnRow>[] = useMemo(
    () => [
      {
        field: "nameJp",
        headerName: "名称",
        flex: 30,
        sortable: false,
        renderCell: (params: GridRenderCellParams<HymnRow>) => (
          <span className={`col-name ${textSizeClass(params.value)}`}>
            {params.value}
          </span>
        ),
      },
      {
        field: "nameKr",
        headerName: "韓国語名称",
        flex: 26,
        sortable: false,
        renderCell: (params: GridRenderCellParams<HymnRow>) => (
          <span className={`col-name ${textSizeClass(params.value)}`}>
            {params.value}
          </span>
        ),
      },
      {
        field: "link",
        headerName: "リンク",
        flex: 10,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params: GridRenderCellParams<HymnRow>) => (
          <a href={params.row.link} target="_blank" rel="noopener noreferrer">
            Link
          </a>
        ),
      },
      {
        field: "score",
        headerName: "楽譜",
        flex: 10,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params: GridRenderCellParams<HymnRow>) => (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              downloadScore(params.row.id);
            }}
          >
            &#x1D11E;
          </a>
        ),
      },
      {
        field: "actions",
        headerName: "操作",
        flex: 24,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params: GridRenderCellParams<HymnRow>) => (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Button
              size="small"
              variant="contained"
              color="secondary"
              onClick={() => goScore(params.row.id)}
            >
              楽譜
            </Button>
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={() => goEdit(params.row.id)}
            >
              編集
            </Button>
            <Button
              size="small"
              variant="contained"
              color="warning"
              onClick={() => onDelete(params.row)}
            >
              削除
            </Button>
          </Box>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page, pageSize, submittedKeyword],
  );

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
      <Card className="mt-2 noto-serif hymnlist-card" sx={{ mt: 1 }}>
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
          <GridViewIcon sx={{ mr: 1 }} />
          <Typography variant="h6">賛美歌情報メンテナンス</Typography>
        </Box>

        <Box sx={{ p: 3 }}>
          <Grid container spacing={2} sx={{ alignItems: "center", mb: 2 }}>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                fullWidth
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={onSearchKeyDown}
                placeholder="キーワードを入力してください"
                variant="outlined"
                size="small"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <SearchIcon
                          sx={{ cursor: "pointer" }}
                          onClick={onSearch}
                        />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} />
            <Grid size={{ xs: 12, md: 3 }} sx={{ textAlign: "right" }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<AddCircleIcon />}
                onClick={goAdd}
              >
                賛美歌情報追加
              </Button>
            </Grid>
          </Grid>

          <DataGrid
            className="hymn-table"
            rows={records}
            columns={columns}
            rowCount={totalRecords}
            loading={isFetching}
            paginationMode="server"
            paginationModel={{ page: page - 1, pageSize }}
            onPaginationModelChange={(model) => {
              setPage(model.page + 1);
              setPageSize(model.pageSize);
            }}
            pageSizeOptions={[5, 10, 15]}
            getRowClassName={(params) => rowClass(params.row.lineNumber)}
            getRowHeight={() => "auto"}
            disableColumnMenu
            disableColumnSorting
            disableRowSelectionOnClick
            autoHeight
          />
        </Box>
      </Card>
    </Box>
  );
}
