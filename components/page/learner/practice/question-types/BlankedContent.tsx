"use client";

// components/page/learner/practice/question-types/BlankedContent.tsx
// Renders question content with its blanks replaced: either interactive spans
// the learner clicks to target (type 6) or read-only display spans showing the
// current fill (fill-in preview and the t5 sentence rows).

import { Fragment, type ReactNode } from "react";
import { hanNodes } from "@/lib/han/hanText";
import { tokenizeContent } from "@/lib/practice/practiceEngine";
import type { GroupUIState } from "@/hooks/usePracticeEngine";

export function BlankedContent({
  content,
  level,
  interactive,
  fills,
  blockId,
  activeBlank,
  onBlankClick,
}: {
  content: string | null;
  level: number | string;
  interactive?: boolean;
  fills?: (string | null)[]; // value shown per blank index
  blockId?: string;
  activeBlank?: GroupUIState["activeBlank"];
  onBlankClick?: (blockId: string, index: number) => void;
}): ReactNode {
  const segs = tokenizeContent(content);
  return (
    <>
      {segs.map((s, i) => {
        if (s.kind === "text") return <Fragment key={i}>{hanNodes(s.text, level)}</Fragment>;
        const val = fills ? fills[s.index] : null;
        if (interactive) {
          const active =
            activeBlank && activeBlank.blockId === blockId && activeBlank.index === s.index;
          const cls = ["blank-gap", val ? "blank-filled" : "blank-empty"];
          if (active) cls.push("blank-active");
          return (
            <span
              key={i}
              className={cls.join(" ")}
              onClick={() => blockId && onBlankClick?.(blockId, s.index)}
            >
              {val || "　　"}
            </span>
          );
        }
        return (
          <span key={i} className={val ? "blank-gap filled" : "blank-gap"}>
            {val ? hanNodes(val, level) : "　　"}
          </span>
        );
      })}
    </>
  );
}
