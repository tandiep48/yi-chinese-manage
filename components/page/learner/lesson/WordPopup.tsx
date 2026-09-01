"use client";

// components/page/learner/lesson/WordPopup.tsx
// The word popup shown when a learner clicks a Lesson Summary word. Ported from
// the #word-popup markup + showWordPopup()/updateSaveWordBtn() in Learning/web_app's
// reading.html / reading.js: hanzi, pinyin, VN + EN meaning (or a "not found"
// state), a play-audio button (only when the word has audio, matching the legacy
// page), a stroke-order toggle, and — for book lessons — an Add/added save toggle.

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faVolumeHigh, faPenNib, faPlus, faCheck } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { vocabAudioUrl } from "@/lib/audio";
import { StrokeOrder } from "./StrokeOrder";
import type { VocabLookup } from "@/lib/types/types";

export function WordPopup({
  word,
  entry,
  saveEnabled,
  isSaved,
  onToggleSave,
  onClose,
}: {
  word: string;
  entry: VocabLookup | null;
  saveEnabled: boolean;
  isSaved: boolean;
  onToggleSave: () => void;
  onClose: () => void;
}) {
  const { t } = useT();
  const [strokeOpen, setStrokeOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const notFound = entry === null;
  const canSave = saveEnabled && !notFound;

  // Close on Escape; stop any popup audio when the popup unmounts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [onClose]);

  const playAudio = () => {
    if (!entry?.audio_key) return;
    audioRef.current?.pause();
    const audio = new Audio(vocabAudioUrl(entry.audio_key));
    audioRef.current = audio;
    audio.play().catch(() => {
      /* ignore playback errors, matching the legacy page */
    });
  };

  return (
    <div className="word-popup-overlay open" onClick={onClose}>
      <div className="word-popup" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="word-popup-close" onClick={onClose} aria-label={t("widgets.close")}>
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <div className="word-popup-hanzi" lang="zh-CN">
          {word}
        </div>
        <div className="word-popup-pinyin">{entry?.pinyin ?? ""}</div>

        {notFound ? (
          <div className="word-popup-meaning">
            <span className="word-popup-not-found">{t("reading.word_not_found")}</span>
          </div>
        ) : (
          <div className="word-popup-meaning">{entry.meaning_vn}</div>
        )}
        {!notFound && entry.meaning_en ? (
          <div className="word-popup-meaning word-popup-meaning-en">{entry.meaning_en}</div>
        ) : null}

        <div className="word-popup-actions">
          {entry?.audio_key ? (
            <button type="button" className="word-popup-btn" onClick={playAudio}>
              <FontAwesomeIcon icon={faVolumeHigh} /> <span>{t("widgets.listen")}</span>
            </button>
          ) : null}
          <button
            type="button"
            className={`word-popup-btn${strokeOpen ? " active" : ""}`}
            onClick={() => setStrokeOpen((v) => !v)}
          >
            <FontAwesomeIcon icon={faPenNib} /> <span>{t("widgets.stroke")}</span>
          </button>
          {canSave ? (
            <button
              type="button"
              className={`word-popup-btn${isSaved ? " active" : ""}`}
              onClick={onToggleSave}
            >
              <FontAwesomeIcon icon={isSaved ? faCheck : faPlus} />{" "}
              <span>{isSaved ? t("widgets.added") : t("widgets.add_to_list")}</span>
            </button>
          ) : null}
        </div>

        {strokeOpen ? <StrokeOrder word={word} /> : null}
      </div>
    </div>
  );
}
