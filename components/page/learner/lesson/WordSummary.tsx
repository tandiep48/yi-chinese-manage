"use client";

// components/page/learner/lesson/WordSummary.tsx
// "Word Summary" (vocab domain) panel — the vocab cards + toolbar from
// Learning/web_app/static/vocab_learning.js's renderVocabTable() and the shared
// lesson_ui2.css .vocab-card design.
//
// Interactive extras (per-card stroke order, "stroke all", and the Learn/Train
// footer actions) are opt-in via callbacks: the read-only lesson-study page
// passes none (buttons stay disabled, no stroke), while the Flash Cards flow
// wires them up. Learn/Train hand back the CURRENT (shuffled) item order.

import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faStop,
  faShuffle,
  faVolumeHigh,
  faEye,
  faEyeSlash,
  faGraduationCap,
  faDumbbell,
  faPaintbrush,
} from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { vocabAudioUrl } from "@/lib/audio";
import { useAudioSequence } from "@/hooks/useAudioSequence";
import type { LessonVocabRow } from "@/lib/types/types";

type Col = "cn" | "py" | "vn";

const HANZI_RE = /[一-鿿]/;

export function WordSummary({
  vocab,
  loading,
  error,
  onLearn,
  onTrain,
  onOpenStroke,
  onStrokeAll,
}: {
  vocab: LessonVocabRow[];
  loading: boolean;
  error: string | null;
  // Opt-in interactions (Flash Cards flow). Learn/Train receive the current
  // on-screen order so a shuffle in the summary carries into the next screen.
  onLearn?: (items: LessonVocabRow[]) => void;
  onTrain?: (items: LessonVocabRow[]) => void;
  onOpenStroke?: (word: string, pinyin: string) => void;
  onStrokeAll?: (items: LessonVocabRow[]) => void;
}) {
  const { t, lang } = useT();
  const [items, setItems] = useState<LessonVocabRow[]>(vocab);
  const [hidden, setHidden] = useState<Set<Col>>(new Set());
  const { activeKey, sequenceActive, playSingle, toggleSequence } = useAudioSequence();

  // Reset the working (shuffleable) list when a new part's vocab arrives —
  // the render-phase "adjust state on prop change" pattern, so no effect fires.
  const [prevVocab, setPrevVocab] = useState(vocab);
  if (vocab !== prevVocab) {
    setPrevVocab(vocab);
    setItems(vocab);
  }

  const playable = useMemo(
    () => items.filter((v) => v.audio_key).map((v) => ({ key: v.cn, src: vocabAudioUrl(v.audio_key) })),
    [items]
  );

  const toggleCol = (col: Col) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });

  const shuffle = () => setItems((prev) => [...prev].sort(() => Math.random() - 0.5));

  const colLabel: Record<Col, string> = {
    cn: t("dashboard.table_character"),
    py: t("dashboard.table_pinyin"),
    vn: t("dashboard.table_meaning_vn"),
  };

  const cardsClass = [
    "vl-vocab-cards",
    hidden.has("cn") ? "hide-cn" : "",
    hidden.has("py") ? "hide-py" : "",
    hidden.has("vn") ? "hide-vn" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="summary-content-card">
      <div className="vl-cards-toolbar">
        <div className="toolbar-left">
          <button
            type="button"
            className={`btn vl-toolbar-primary${sequenceActive ? " playing" : ""}`}
            onClick={() => toggleSequence(playable)}
            disabled={playable.length === 0}
            title={t("reading.play_all_vocab_audio")}
          >
            <FontAwesomeIcon icon={sequenceActive ? faStop : faPlay} />{" "}
            {sequenceActive ? t("reading.stop_auto_play") : t("vocab_learning.play_all")}
          </button>
          <button type="button" className="btn" onClick={shuffle} title={t("reading.shuffle_vocab_audio")}>
            <FontAwesomeIcon icon={faShuffle} /> {t("vocab_learning.shuffle")}
          </button>
          {onStrokeAll && (
            <button
              type="button"
              className="btn"
              onClick={() => onStrokeAll(items)}
              title={t("vocab.stroke_all_aria")}
            >
              <FontAwesomeIcon icon={faPaintbrush} /> {t("vocab_learning.stroke_order")}
            </button>
          )}
        </div>
        <div className="toolbar-right">
          {(["cn", "py", "vn"] as Col[]).map((col) => (
            <button
              key={col}
              type="button"
              className={`btn vl-col-toggle${hidden.has(col) ? " active" : ""}`}
              onClick={() => toggleCol(col)}
            >
              <FontAwesomeIcon icon={hidden.has(col) ? faEyeSlash : faEye} /> {colLabel[col]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="vocab-empty">{t("dashboard.loading")}</div>
      ) : error ? (
        <div className="vocab-empty">{t("reading.failed_load_vocabulary")}</div>
      ) : items.length === 0 ? (
        <div className="vocab-empty">{t("reading.no_vocab_linked")}</div>
      ) : (
        <div className={cardsClass}>
          {items.map((v, index) => (
            <div key={`${v.cn}-${index}`} className={`vocab-card${activeKey === v.cn ? " playing-highlight" : ""}`}>
              <div className="vc-left">
                <span className="vc-num">{index + 1}</span>
                <div className="vc-char" lang="zh-CN">
                  {v.cn}
                </div>
              </div>
              <div className="vc-pinyin">{v.pinyin}</div>
              <div className="vc-meaning">{(lang === "vi" ? v.meaning_vn : v.meaning_en) || v.meaning_en || v.meaning_vn}</div>
              <div className="vc-right">
                {onOpenStroke && HANZI_RE.test(v.cn) ? (
                  <button
                    type="button"
                    className="action-btn"
                    onClick={() => onOpenStroke(v.cn, v.pinyin || "")}
                    title={t("vocab_learning.show_stroke_order_aria")}
                    aria-label={t("vocab_learning.show_stroke_order_aria")}
                  >
                    <FontAwesomeIcon icon={faPaintbrush} />
                  </button>
                ) : null}
                {v.audio_key ? (
                  <button
                    type="button"
                    className="action-btn"
                    onClick={() => playSingle(v.cn, vocabAudioUrl(v.audio_key))}
                    title={t("reading.play_word_audio")}
                    aria-label={t("reading.play_audio_for", { word: v.cn })}
                  >
                    <FontAwesomeIcon icon={faVolumeHigh} />
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="vl-summary-footer">
        {/* Enabled only when the host wires the flow (Flash Cards); the read-only
            lesson-study page leaves these disabled. */}
        <button
          type="button"
          className="vl-train-btn vl-learn-btn"
          disabled={!onLearn}
          onClick={onLearn ? () => onLearn(items) : undefined}
        >
          <FontAwesomeIcon icon={faGraduationCap} /> {t("vocab_learning.learn_these_words")}
        </button>
        <button
          type="button"
          className="vl-train-btn"
          disabled={!onTrain}
          onClick={onTrain ? () => onTrain(items) : undefined}
        >
          <FontAwesomeIcon icon={faDumbbell} /> {t("vocab_learning.train_these_vocab")}
        </button>
      </div>
    </div>
  );
}
