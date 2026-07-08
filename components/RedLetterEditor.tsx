// src/components/RedLetterEditor.tsx
"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { Box, FormHelperText } from "@mui/material";

type Segment = { text: string; red: boolean };

const MARKER_REGEX = /\{\{([\s\S]*?)\}\}/g;

function parseToSegments(raw: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  MARKER_REGEX.lastIndex = 0;
  while ((m = MARKER_REGEX.exec(raw)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ text: raw.slice(lastIndex, m.index), red: false });
    }
    segments.push({ text: m[1], red: true });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < raw.length) {
    segments.push({ text: raw.slice(lastIndex), red: false });
  }
  if (segments.length === 0) segments.push({ text: "", red: false });
  return segments;
}

function segmentsToRaw(segments: Segment[]): string {
  return segments.map((s) => (s.red ? `{{${s.text}}}` : s.text)).join("");
}

function domToSegments(container: HTMLElement): Segment[] {
  const segments: Segment[] = [];
  container.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      segments.push({ text: node.textContent ?? "", red: false });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      segments.push({
        text: el.textContent ?? "",
        red: el.classList.contains("red-letter"),
      });
    }
  });
  return segments;
}

function renderSegments(container: HTMLElement, segments: Segment[]) {
  container.innerHTML = "";
  segments.forEach((seg) => {
    if (seg.red) {
      const span = document.createElement("span");
      span.className = "red-letter";
      span.textContent = seg.text;
      container.appendChild(span);
    } else if (seg.text) {
      container.appendChild(document.createTextNode(seg.text));
    }
  });
}

function getCaretOffset(container: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;
  const range = sel.getRangeAt(0);
  const pre = range.cloneRange();
  pre.selectNodeContents(container);
  pre.setEnd(range.endContainer, range.endOffset);
  return pre.toString().length;
}

function setCaretOffset(container: HTMLElement, offset: number) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let remaining = offset;
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const len = node.textContent?.length ?? 0;
    if (remaining <= len) {
      const range = document.createRange();
      range.setStart(node, remaining);
      range.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      return;
    }
    remaining -= len;
  }
  const range = document.createRange();
  range.selectNodeContents(container);
  range.collapse(false);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

export type RedLetterEditorHandle = {
  wrapSelection: () => void;
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  minHeight?: number;
};

export const RedLetterEditor = forwardRef<RedLetterEditorHandle, Props>(
  (
    { value, onChange, placeholder, error, helperText, minHeight = 84 },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const skipNextSync = useRef(false);
    const isComposing = useRef(false);

    // 外部からのvalue変更(初期化・保存後のクリアなど)の時だけDOMを作り直す
    useEffect(() => {
      if (skipNextSync.current) {
        skipNextSync.current = false;
        return;
      }
      const el = containerRef.current;
      if (!el) return;
      renderSegments(el, parseToSegments(value));
    }, [value]);

    const reconcile = useCallback(() => {
      const el = containerRef.current;
      if (!el) return;
      const caret = getCaretOffset(el);
      const segments = domToSegments(el);
      const raw = segmentsToRaw(segments);
      skipNextSync.current = true;
      onChange(raw);
      requestAnimationFrame(() => {
        if (!containerRef.current) return;
        renderSegments(containerRef.current, segments);
        setCaretOffset(containerRef.current, caret);
      });
    }, [onChange]);

    useImperativeHandle(ref, () => ({
      wrapSelection: () => {
        const el = containerRef.current;
        const sel = window.getSelection();
        if (!el || !sel || sel.rangeCount === 0 || sel.isCollapsed) return;
        const range = sel.getRangeAt(0);
        if (!el.contains(range.commonAncestorContainer)) return;
        const span = document.createElement("span");
        span.className = "red-letter";
        span.appendChild(range.extractContents());
        range.insertNode(span);
        const newRange = document.createRange();
        newRange.setStartAfter(span);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
        reconcile();
      },
    }));

    return (
      <Box>
        <div
          ref={containerRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          onInput={() => {
            if (!isComposing.current) reconcile();
          }}
          onCompositionStart={() => {
            isComposing.current = true;
          }}
          onCompositionEnd={() => {
            isComposing.current = false;
            reconcile();
          }}
          className="noto-serif red-letter-editor"
          style={{
            minHeight,
            padding: "16.5px 14px",
            borderRadius: 4,
            border: `1px solid ${error ? "#d32f2f" : "rgba(0,0,0,0.23)"}`,
            fontSize: "1rem",
            lineHeight: 1.4375,
            outline: "none",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            background: "#fff",
          }}
        />
        {helperText && (
          <FormHelperText error={error}>{helperText}</FormHelperText>
        )}
      </Box>
    );
  },
);

RedLetterEditor.displayName = "RedLetterEditor";
