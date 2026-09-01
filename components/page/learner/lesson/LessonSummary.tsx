"use client";

// components/page/learner/lesson/LessonSummary.tsx
// Read-only "Lesson Summary" (reading domain) panel for a lesson part — the
// passage preview lines + toolbar from Learning/web_app/static/reading/reading.js's
// renderLessonSummary(), styled with the shared lesson_ui2.css .lesson-preview-line
// design. Each line renders as clickable word tokens (renderTokens); clicking a
// word opens the vocab WordPopup (pinyin/meaning/audio/stroke/save). The graded
// "Learn/Train" flows remain deferred.

import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faStop, faEye, faEyeSlash, faVolumeHigh, faGraduationCap, faDumbbell } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { lessonAudioUrl, lessonAudioFolder } from "@/lib/audio";
import { isPunctToken } from "@/lib/lessons/tokens";
import { useAudioSequence } from "@/hooks/useAudioSequence";
import { useWordLookup } from "@/hooks/useWordLookup";
import { useSavedWords } from "@/hooks/useSavedWords";
import { WordPopup } from "./WordPopup";
import type { LessonPassageDetail, LessonPassageLine } from "@/lib/types/types";

export function LessonSummary({
  passage,
  loading,
  error,
}: {
  passage: LessonPassageDetail | null;
  loading: boolean;
  error: string | null;
}) {
  const { t, lang } = useT();
  const [showPinyin, setShowPinyin] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const { activeKey, sequenceActive, playSingle, toggleSequence } = useAudioSequence();

  const lines = useMemo(() => passage?.lines ?? [], [passage]);
  const folder = useMemo(() => (passage ? lessonAudioFolder(passage) : ""), [passage]);

  const { lookupMap } = useWordLookup(lines);
  const { enabled: saveEnabled, saved, toggle: toggleSaved } = useSavedWords(passage);

  const renderTokens = (line: LessonPassageLine) => {
    if (!line.tokens || line.tokens.length === 0) return line.content;
    return line.tokens.map((tok, i) =>
      isPunctToken(tok) ? (
        <span key={i} className="line-token">
          {tok}
        </span>
      ) : (
        <span
          key={i}
          className="line-token clickable"
          role="button"
          tabIndex={0}
          onClick={() => setSelectedWord(tok)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedWord(tok);
            }
          }}
        >
          {tok}
        </span>
      )
    );
  };

  const playable = useMemo(
    () =>
      lines
        .map((line, i) => ({ line, i }))
        .filter(({ line }) => line.audio_key)
        .map(({ line, i }) => ({ key: String(i), src: lessonAudioUrl(folder, line.audio_key as string) })),
    [lines, folder]
  );

  return (
    <div className="lesson-summary-content-card">
      <div className="lesson-summary-toolbar">
        <div className="toolbar-left">
          <button
            type="button"
            className={`btn${sequenceActive ? " primary" : ""}`}
            onClick={() => toggleSequence(playable)}
            disabled={playable.length === 0}
          >
            <FontAwesomeIcon icon={sequenceActive ? faStop : faPlay} />{" "}
            <span>{sequenceActive ? t("reading.stop_auto_play") : t("reading.auto_play")}</span>
          </button>
        </div>
        <div className="toolbar-right">
          <button type="button" className={`btn sum-toggle${showPinyin ? " primary" : ""}`} onClick={() => setShowPinyin((v) => !v)}>
            <FontAwesomeIcon icon={showPinyin ? faEyeSlash : faEye} />{" "}
            <span>{t(showPinyin ? "reading.hide_pinyin" : "reading.show_pinyin")}</span>
          </button>
          <button type="button" className={`btn sum-toggle${showMeaning ? " primary" : ""}`} onClick={() => setShowMeaning((v) => !v)}>
            <FontAwesomeIcon icon={showMeaning ? faEyeSlash : faEye} />{" "}
            <span>{t(showMeaning ? "reading.hide_meaning" : "reading.show_meaning")}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="lesson-learner-empty">{t("reading.loading_passage")}</div>
      ) : error ? (
        <div className="lesson-learner-empty">{t("reading.failed_load_passage")}</div>
      ) : lines.length === 0 ? (
        <div className="lesson-learner-empty">{t("reading.no_lines_found")}</div>
      ) : (
        <div className="lesson-learner-preview">
          {lines.map((line, index) => {
            const src = line.audio_key ? lessonAudioUrl(folder, line.audio_key) : null;
            const meaning = (lang === "vi" ? line.translations.vi : line.translations.en) || line.translations.en || line.translations.vi || "";
            return (
              <div
                key={line.line_id}
                className={`lesson-preview-line${activeKey === String(index) ? " playing-highlight" : ""}`}
              >
                {src ? (
                  <button
                    type="button"
                    className="lesson-passage-audio-btn"
                    onClick={() => playSingle(String(index), src)}
                    title={t("reading.play_passage_line", { n: index + 1 })}
                    aria-label={t("reading.play_passage_line", { n: index + 1 })}
                  >
                    <FontAwesomeIcon icon={faVolumeHigh} />
                  </button>
                ) : (
                  <span className="lesson-passage-audio-btn lesson-passage-audio-empty" aria-hidden="true" />
                )}
                <div className="lesson-preview-text">
                  <div className="hanzi-text" lang="zh-CN">
                    {renderTokens(line)}
                  </div>
                  <div className={`pinyin-text${showPinyin ? " show" : ""}`}>{line.pinyin}</div>
                  <div className={`meaning-text${showMeaning ? " show" : ""}`}>{meaning}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="lesson-summary-actions">
        {/* The graded flows are deferred in this read-only cut. */}
        <button type="button" className="vl-train-btn vl-learn-btn" disabled>
          <FontAwesomeIcon icon={faGraduationCap} /> {t("reading.learn_this_lesson")}
        </button>
        <button type="button" className="vl-train-btn" disabled>
          <FontAwesomeIcon icon={faDumbbell} /> {t("reading.train_this_lesson")}
        </button>
      </div>

      {selectedWord !== null && (
        <WordPopup
          word={selectedWord}
          entry={lookupMap[selectedWord] ?? null}
          saveEnabled={saveEnabled}
          isSaved={saved.has(selectedWord)}
          onToggleSave={() => toggleSaved(selectedWord)}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </div>
  );
}
