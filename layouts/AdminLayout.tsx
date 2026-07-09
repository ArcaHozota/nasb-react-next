"use client";

// src/layouts/AdminLayout.tsx
import { useState, useEffect, type KeyboardEvent, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Box,
  AppBar,
  Toolbar,
  TextField,
  IconButton,
  InputAdornment,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Menu,
  MenuItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LogoutIcon from "@mui/icons-material/Logout";
import AnchorIcon from "@mui/icons-material/Anchor";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import MessageIcon from "@mui/icons-material/Message";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useAuthStore } from "@/stores/authStore";
import { useFeedbackStore } from "@/stores/feedbackStore";
import { DELAY_APOLOGY } from "@/constants";
import brandLogo from "@/assets/jerusalem-cross2.svg";

const DRAWER_WIDTH = 256;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const username = useAuthStore((s) => s.username);
  const userId = useAuthStore((s) => s.userId);
  const logout = useAuthStore((s) => s.logout);
  const toast = useFeedbackStore((s) => s.toast);
  const confirm = useFeedbackStore((s) => s.confirm);

  const [keyword, setKeyword] = useState("");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  // 旧 router.tsx の RequireAuth 相当。ここで認証チェックを行う。
  useEffect(() => {
    const onUnauthorized = () => {
      window.location.href = "/home";
    };
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, [router]);

  useEffect(() => {
    if (!user) {
      fetchMe().catch(() => {
        window.location.href = "/home";
      });
    }
  }, [user, fetchMe, router]);

  // Hooksは全て上で呼び終えているので、ここで早期returnして問題ない
  if (!user) return <div>読み込み中...</div>;

  const navItems = [
    {
      key: "bookSearch",
      icon: <AnchorIcon />,
      title: "聖書章節選択",
      action: () => toast(DELAY_APOLOGY),
    },
    {
      key: "bookAdd",
      icon: <Inventory2Icon />,
      title: "聖書章節入力",
      action: () => router.push("/books/add"),
    },
    {
      key: "hymns",
      icon: <MusicNoteIcon />,
      title: "賛美歌一覧",
      action: () => router.push("/hymns"),
    },
    {
      key: "randomFive",
      icon: <ShuffleIcon />,
      title: "ランダム五つ",
      action: () => router.push("/hymns/random-five"),
    },
  ];

  const onLogout = async () => {
    const ok = await confirm("ログアウトしてよろしいでしょうか。", "警告");
    if (!ok) return;
    await logout();
    window.location.href = "/home";
  };

  const onSearch = () => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    router.push(`/hymns/random-five?keyword=${encodeURIComponent(trimmed)}`);
  };

  const onSearchKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") onSearch();
  };

  const openUserMenu = (e: MouseEvent<HTMLElement>) =>
    setMenuAnchor(e.currentTarget);
  const closeUserMenu = () => setMenuAnchor(null);

  const goPersonal = () => {
    closeUserMenu();
    router.push(`/personal?userId=${userId() ?? ""}`);
  };

  return (
    <Box sx={{ display: "flex" }}>
      {/* ===== 上部バー ===== */}
      <AppBar
        position="fixed"
        sx={{
          bgcolor: "grey.900",
          ml: `${DRAWER_WIDTH}px`,
          width: `calc(100% - ${DRAWER_WIDTH}px)`,
          boxShadow: "none",
        }}
      >
        <Toolbar variant="dense" sx={{ justifyContent: "flex-end" }}>
          <TextField
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="検索"
            size="small"
            variant="filled"
            hiddenLabel
            sx={{ maxWidth: 240, mr: 2, bgcolor: "grey.100", borderRadius: 1 }}
            slotProps={{
              input: {
                disableUnderline: true,
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <IconButton color="error" onClick={onLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* ===== 左ドロワー ===== */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: DRAWER_WIDTH,
            bgcolor: "grey.900",
            color: "#fff",
            zIndex: 1300,
            display: "flex", // ← 追加
            flexDirection: "column", // ← 追加
          },
        }}
      >
        {/* ブランド */}
        <ListItemButton
          onClick={() => router.push("/mainmenu")}
          sx={{
            flex: "0 0 auto", // ← flexShrink:0 だけでなく flexGrow:0 も固定
            minHeight: 0,
            py: 3.3,
            gap: 1,
            bgcolor: "#fffff0",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ListItemAvatar sx={{ minWidth: 49 }}>
            <Box sx={{ position: "relative", width: 49, height: 49 }}>
              <Image
                src={brandLogo}
                alt=""
                fill
                style={{ objectFit: "cover" }}
              />
            </Box>
          </ListItemAvatar>
          <span
            className="effect-shine"
            style={{ fontSize: "1.9rem", whiteSpace: "nowrap", lineHeight: 1 }}
          >
            NASB1995
          </span>
        </ListItemButton>
        <Divider />

        {/* メインナビ */}
        <List sx={{ flexGrow: 1, py: 0 }}>
          {navItems.map((item) => (
            <ListItemButton
              key={item.key}
              onClick={item.action}
              sx={{ justifyContent: "center" }}
            >
              <ListItemIcon
                sx={{ color: "inherit", minWidth: "auto", mr: 1.5 }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.title}
                sx={{ flexGrow: 0 }}
              />
            </ListItemButton>
          ))}
        </List>

        {/* ユーザードロップダウン */}
        <Divider />
        <ListItemButton
          onClick={openUserMenu}
          sx={{
            flex: "0 0 auto", // ← 同様
            minHeight: 0,
            py: 0.5,
            display: "flex",
            alignItems: "center",
          }}
        >
          <ListItemAvatar sx={{ minWidth: 40 }}>
            <Avatar
              src="https://github.com/mdo.png"
              sx={{ width: 30, height: 30 }}
            />
          </ListItemAvatar>
          <ListItemText
            primary={username()}
            slotProps={{ primary: { sx: { fontSize: "0.9rem" } } }}
          />
          <ExpandLessIcon fontSize="small" />
        </ListItemButton>
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={closeUserMenu}
          anchorOrigin={{ vertical: "top", horizontal: "left" }}
          transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <MenuItem onClick={goPersonal}>
            <ListItemIcon>
              <ManageAccountsIcon fontSize="small" />
            </ListItemIcon>
            個人スペース
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeUserMenu();
              toast(DELAY_APOLOGY);
            }}
          >
            <ListItemIcon>
              <MessageIcon fontSize="small" />
            </ListItemIcon>
            メッセージ
          </MenuItem>
          <Divider />
          <MenuItem onClick={onLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            ログアウト
          </MenuItem>
        </Menu>
      </Drawer>

      {/* ===== 各画面 ===== */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: "48px",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
