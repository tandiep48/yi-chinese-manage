"use client";

// components/page/learner/vocab-review/VocabReviewPage.tsx
// Saved-word review page — the target of the dashboard's "Review" card. Shows one
// combined, priority-ordered list (critical > unsure > incomplete) from
// /api/vocab/review; the learner ticks all or some of it and starts the batch
// trainer. Ported from Learning/web_app/templates/vocab/vocab_review.html +
// static/vocab/vocab_review.js.
//
// Like the legacy page it hands the selection to /vocab-training-batch through
// sessionStorage without opening the train-type picker, so the trainer falls back
// to its default activity mix.

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVolumeHigh } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { useVocabReview } from "@/hooks/useVocabReview";
import { pickMeaning } from "@/lib/lessons/meaning";
import { vocabAudioUrl } from "@/lib/audio";
import "./vocab-review.css";

const TRAINER_WORDS_KEY = "selectedVocabTrainerWords";

export function VocabReviewPage() {
  const { t, lang } = useT();
  const router = useRouter();
  const review = useVocabReview();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const selectAllRef = useRef<HTMLInputElement | null>(null);

  // `indeterminate` is a DOM property with no React attribute, so it has to be
  // written to the node directly.
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = review.someSelected;
    }
  }, [review.someSelected]);

  useEffect(
    () => () => {
      audioRef.current?.pause();
      audioRef.current = null;
    },
    []
  );

  const playAudio = useCallback((audioKey: string) => {
    if (!audioKey) return;
    audioRef.current?.pause();
    const audio = new Audio(vocabAudioUrl(audioKey));
    audioRef.current = audio;
    audio.play().catch(() => {
      // Autoplay blocked or the object is missing — silent, like the legacy page.
    });
  }, []);

  function startTraining() {
    if (review.selectedCount === 0) return;
    try {
      sessionStorage.setItem(
        TRAINER_WORDS_KEY,
        JSON.stringify(review.selectedWords)
      );
    } catch {
      // sessionStorage unavailable (private mode); the trainer redirects to
      // /vocab rather than crashing.
    }
    router.push("/learner/vocab-training-batch");
  }

  return (
    <div className="vocab-review">
      <div className="vocab-review-wrap">
        <div className="vocab-top-link">
          <Link href="/learner">&larr; {t("picker.back_to_dashboard")}</Link>
        </div>

        <div className="review-content-card">
          <div className="review-header">
            <div>
              <h1 className="review-heading">{t("vocab_review.heading")}</h1>
              <p className="review-subtitle">{t("vocab_review.subtitle")}</p>
            </div>
            <button
              type="button"
              className="btn primary review-start-btn"
              onClick={startTraining}
              disabled={review.selectedCount === 0}
            >
              {t("vocab_review.start_training", { count: review.selectedCount })}
            </button>
          </div>

          {review.status !== "ready" ? (
            <div className="review-state">
              {t(
                review.status === "loading"
                  ? "vocab_review.loading"
                  : "vocab_review.load_failed"
              )}
            </div>
          ) : (
            <section className="review-section">
              <div className="review-section-head">
                <label className="review-select-all">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={review.allSelected}
                    disabled={review.rows.length === 0}
                    onChange={(e) => review.toggleAll(e.target.checked)}
                  />
                  <span>{t("vocab_review.select_all")}</span>
                </label>
                <h2 className="review-section-title">
                  {t("vocab_review.list_title")}
                  <span className="review-section-count">
                    {review.rows.length}
                  </span>
                </h2>
              </div>

              {review.rows.length === 0 ? (
                <div className="review-empty">{t("vocab_review.empty")}</div>
              ) : (
                <div className="review-list">
                  {review.rows.map((row) => {
                    const word = row.word || row.cn;
                    return (
                      <label className="review-item" key={word}>
                        <input
                          type="checkbox"
                          className="review-item-cb"
                          checked={review.isSelected(row)}
                          onChange={(e) =>
                            review.toggleWord(row, e.target.checked)
                          }
                        />
                        <span className="review-item-word">{word}</span>
                        <span className="review-item-pinyin">
                          {row.pinyin || ""}
                        </span>
                        <span className="review-item-meaning">
                          {pickMeaning(row, lang)}
                        </span>
                        {row.audio_key && (
                          <button
                            type="button"
                            className="review-audio-btn"
                            title={t("lesson.play_audio")}
                            aria-label={t("lesson.play_audio")}
                            // The button sits inside the row's <label>, so the
                            // default action would also toggle the checkbox.
                            onClick={(e) => {
                              e.preventDefault();
                              playAudio(row.audio_key);
                            }}
                          >
                            <FontAwesomeIcon icon={faVolumeHigh} aria-hidden />
                          </button>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              {review.canLoadMore && (
                <button
                  type="button"
                  className="btn secondary review-load-more"
                  onClick={review.loadMore}
                  disabled={review.loadingMore}
                >
                  {t("vocab_review.load_more")}
                </button>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
