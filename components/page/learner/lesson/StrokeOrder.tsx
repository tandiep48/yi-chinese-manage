"use client";

// components/page/learner/lesson/StrokeOrder.tsx
// Stroke-order panel for the word popup — a per-character tab strip and a
// HanziWriter canvas with Animate / Practice (quiz) / Reset controls. Ported from
// _buildWordStroke()/wordStrokeAnimate()/wordStrokeQuiz()/wordStrokeReset() in
// Learning/web_app/static/reading/reading.js. HanziWriter is imported dynamically
// (client-only) so it never runs during SSR, and it fetches character data from
// its CDN at runtime just like the legacy page.

import { useEffect, useMemo, useRef, useState } from "react";
import type HanziWriterInstance from "hanzi-writer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPen, faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import "./stroke-order.css";

export function StrokeOrder({ word }: { word: string }) {
  const { t } = useT();
  const chars = useMemo(() => [...word], [word]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [resetToken, setResetToken] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriterInstance | null>(null);

  // Reset to the first character whenever the word changes.
  useEffect(() => {
    setActiveIdx(0);
    setResetToken(0);
  }, [word]);

  useEffect(() => {
    const el = containerRef.current;
    const char = chars[activeIdx];
    if (!el || !char) return;

    let cancelled = false;
    el.innerHTML = "";
    import("hanzi-writer").then(({ default: HanziWriter }) => {
      if (cancelled || !containerRef.current) return;
      writerRef.current = HanziWriter.create(el, char, {
        width: 200,
        height: 200,
        padding: 10,
        showOutline: true,
        strokeColor: "#576856",
        outlineColor: "rgba(87,104,86,0.15)",
      });
    });

    return () => {
      cancelled = true;
      try {
        writerRef.current?.cancelQuiz();
      } catch {
        /* writer already torn down */
      }
      writerRef.current = null;
      el.innerHTML = "";
    };
  }, [chars, activeIdx, resetToken]);

  return (
    <div className="word-popup-stroke-area">
      {chars.length > 1 && (
        <div className="stroke-char-tabs">
          {chars.map((ch, i) => (
            <button
              key={i}
              type="button"
              className={`stroke-tab${i === activeIdx ? " active" : ""}`}
              onClick={() => setActiveIdx(i)}
              lang="zh-CN"
            >
              {ch}
            </button>
          ))}
        </div>
      )}
      <div className="stroke-canvas-wrap">
        <div ref={containerRef} className="stroke-container" />
      </div>
      <div className="stroke-controls">
        <button type="button" className="stroke-btn" onClick={() => writerRef.current?.animateCharacter()}>
          <FontAwesomeIcon icon={faPlay} /> {t("widgets.animate")}
        </button>
        <button type="button" className="stroke-btn" onClick={() => writerRef.current?.quiz()}>
          <FontAwesomeIcon icon={faPen} /> {t("widgets.practice")}
        </button>
        <button type="button" className="stroke-btn secondary" onClick={() => setResetToken((n) => n + 1)}>
          <FontAwesomeIcon icon={faRotateLeft} /> {t("widgets.reset")}
        </button>
      </div>
    </div>
  );
}
