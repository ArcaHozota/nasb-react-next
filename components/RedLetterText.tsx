// src/components/RedLetterText.tsx
import { Fragment, type ReactNode } from "react";

const MARKER_REGEX = /\{\{(.+?)\}\}/gs;

type Props = {
  text: string;
  className?: string;
};

export function RedLetterText({ text, className }: Props) {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  MARKER_REGEX.lastIndex = 0;
  while ((match = MARKER_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>,
      );
    }
    parts.push(
      <span className="red-letter" key={key++}>
        {match[1]}
      </span>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }
  return <span className={className}>{parts}</span>;
}
