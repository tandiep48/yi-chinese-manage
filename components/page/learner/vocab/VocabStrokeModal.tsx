"use client";

// components/page/learner/vocab/VocabStrokeModal.tsx
// Stroke-order modal for the vocab table. Two modes, ported from
// openVocabStrokeModal() and strokeOrderAll() in
// Learning/web_app/static/vocab/vocab_select.js:
//   - "word": one word, reusing the shared StrokeOrder panel (per-character
//     tabs + Animate / Practice / Reset).
//   - "all": every Chinese character across the current page, animated in
//     sequence with a progress counter, auto-advancing when each finishes.
// HanziWriter is imported dynamically so it stays client-only.

import { useEffect, useRef, useState } from "react";
import type HanziWriterInstance from "hanzi-writer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { StrokeOrder } from "@/components/page/learner/lesson/StrokeOrder";
import "./vocab-stroke-modal.css";

export interface StrokeAllItem {
  ch: string;
  word: string;
  pinyin: string;
}

export type StrokeModalState =
  | { mode: "word"; word: string; pinyin: string }
  | { mode: "all"; queue: StrokeAllItem[] }
  | null;

export function VocabStrokeModal({
  state,
  onClose,
}: {
  state: StrokeModalState;
  onClose: () => void;
}) {
  const { t } = useT();

  // Close on Escape while open.
  useEffect(() => {
    if (!state) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [state, onClose]);

  if (!state) return null;

  const header =
    state.mode === "word"
      ? { word: state.word, pinyin: state.pinyin }
      : null; // "all" renders its own header from the active item

  return (
    <div
      className="stroke-modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="stroke-modal">
        {state.mode === "word" ? (
          <>
            <div className="stroke-modal-header">
              <div>
                <div className="stroke-modal-word" lang="zh-CN">
                  {header?.word}
                </div>
                <div className="stroke-modal-pinyin">{header?.pinyin}</div>
              </div>
              <button className="stroke-modal-close" onClick={onClose} aria-label={t("widgets.close")}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <StrokeOrder word={state.word} />
            <p className="stroke-hint">{t("vocab.stroke_hint")}</p>
          </>
        ) : (
          <StrokeAllBody queue={state.queue} onClose={onClose} />
        )}
      </div>
    </div>
  );
}

// Sequential stroke player for the "stroke all" header button.
function StrokeAllBody({ queue, onClose }: { queue: StrokeAllItem[]; onClose: () => void }) {
  const { t } = useT();
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriterInstance | null>(null);
  const item = queue[index];

  useEffect(() => {
    const el = containerRef.current;
    const char = queue[index]?.ch;
    if (!el || !char) return;

    let cancelled = false;
    let advanceTimer: ReturnType<typeof setTimeout> | undefined;
    el.innerHTML = "";
    import("hanzi-writer").then(({ default: HanziWriter }) => {
      if (cancelled || !containerRef.current) return;
      const writer = HanziWriter.create(el, char, {
        width: 200,
        height: 200,
        padding: 10,
        showOutline: true,
        showCharacter: false,
        strokeColor: "#007a61",
        outlineColor: "rgba(0,122,97,0.15)",
        delayBetweenStrokes: 300,
      });
      writerRef.current = writer;
      writer.animateCharacter({
        onComplete: () => {
          if (cancelled) return;
          advanceTimer = setTimeout(() => {
            if (cancelled) return;
            setIndex((i) => (i + 1 < queue.length ? i + 1 : i));
          }, 600);
        },
      });
    });

    return () => {
      cancelled = true;
      if (advanceTimer) clearTimeout(advanceTimer);
      writerRef.current = null;
      el.innerHTML = "";
    };
  }, [queue, index]);

  return (
    <>
      <div className="stroke-modal-header">
        <div>
          <div className="stroke-modal-word" lang="zh-CN">
            {item?.word}
          </div>
          <div className="stroke-modal-pinyin">
            {`${item?.pinyin ? item.pinyin + " · " : ""}${index + 1}/${queue.length}`}
          </div>
        </div>
        <button className="stroke-modal-close" onClick={onClose} aria-label={t("widgets.close")}>
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
      <div className="stroke-canvas-wrap">
        <div ref={containerRef} className="stroke-container" />
      </div>
      <p className="stroke-hint">{t("vocab.stroke_hint")}</p>
    </>
  );
}
