"use client";

// src/components/FeedbackHost.tsx
import {
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { useFeedbackStore } from "@/stores/feedbackStore";

export default function FeedbackHost() {
  const snackbar = useFeedbackStore((s) => s.snackbar);
  const dialog = useFeedbackStore((s) => s.dialog);
  const closeSnackbar = useFeedbackStore((s) => s.closeSnackbar);
  const answer = useFeedbackStore((s) => s.answer);

  return (
    <>
      <Snackbar
        open={snackbar.show}
        autoHideDuration={3000}
        onClose={closeSnackbar}
        message={snackbar.text}
      />

      <Dialog open={dialog.show} onClose={() => answer(false)}>
        <DialogTitle>{dialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{dialog.text}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => answer(false)}>キャンセル</Button>
          <Button onClick={() => answer(true)} variant="contained" autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
