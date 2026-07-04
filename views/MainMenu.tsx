"use client";

// src/views/MainMenu.tsx
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Grid, Card, Typography } from "@mui/material";
import { useFeedbackStore } from "@/stores/feedbackStore";
import { DELAY_APOLOGY } from "@/constants";
import burgundy from "@/assets/burgundy.svg";
import bourbon from "@/assets/bourbon.svg";
import newaragon from "@/assets/newaragon.svg";

type MenuCard = {
  key: string;
  title: string;
  color: string;
  img: string;
  action: () => void;
};

export default function MainMenu() {
  const router = useRouter();
  const toast = useFeedbackStore((s) => s.toast);
  const cards: MenuCard[] = [
    {
      key: "books",
      title: "聖書奉読",
      color: "#800020",
      img: burgundy,
      action: () => toast(DELAY_APOLOGY),
    },
    {
      key: "hymns",
      title: "賛美歌集め",
      color: "#006400",
      img: bourbon,
      action: () => router.push("/hymns"),
    },
    {
      key: "random",
      title: "ランダム選択",
      color: "#002fa7",
      img: newaragon,
      action: () => router.push("/hymns/random-five"),
    },
  ];

  // 旧 mainmenu.js:localStorage の redirectMessage / loginMsg をトースト表示
  useEffect(() => {
    const msg = localStorage.getItem("redirectMessage");
    if (msg) {
      toast(msg);
      localStorage.removeItem("redirectMessage");
    }
  }, [toast]);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, color: "#800020" }}>
        メインメニュー
      </Typography>

      <Grid container spacing={2}>
        {cards.map((card) => (
          <Grid key={card.key} size={{ xs: 12, md: 4 }}>
            <Card
              onClick={card.action}
              sx={{
                position: "relative",
                cursor: "pointer",
                height: "66vh",
              }}
            >
              <Box
                component="img"
                src={card.img}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  width: "100%",
                  color: "#fff",
                  background: "rgba(0, 0, 0, 0.35)",
                  transition: "color 0.2s ease",
                  textAlign: "center",
                  py: 1.5,
                  ".MuiCard-root:hover &": {
                    color: card.color,
                  },
                }}
              >
                <Typography variant="h5">{card.title}</Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
