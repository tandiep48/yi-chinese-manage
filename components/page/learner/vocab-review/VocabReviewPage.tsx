"use client";

// components/page/learner/vocab-review/VocabReviewPage.tsx
// Saved-word review page — the target of the dashboard's "Review" card. Shows one
// combined, priority-ordered list (critical > unsure > incomplete) from
// /api/vocab/review; the learner ticks all or some of it and starts the batch
// trainer. Ported from Learning/web_app/templates/vocab/vocab_review.html +
// static/vocab/vocab_review.js.
//
// The layout is the vocabulary page's, not a second one: this mounts the same
// `.vocab-select` shell (vocab-select.css) and the same VocabTable + stroke modal
// that /learner/vocab does, so review gets that page's study tools — column hide,
// per-cell reveal, shuffle, play-all, stroke order — for free and there is one
// table to maintain instead of two. Only what is genuinely different lives here:
// the heading block, the loaded count, and "Load more" in place of pagination
// (the review list grows by appending, it does not page).
//
// `.vocab-review` is a second class on the SAME element, never a wrapper, and
// vocab-review.css styles only leaf classes that vocab-select.css and
// vocab-table.css do not define — no two rules can tie at (0,2,0) (§2).
//
// Like the legacy page it hands the selection to /vocab-training-batch through
// sessionStorage without opening the train-type picker, so the trainer falls back
// to its default activity mix.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "@/components/i18n/I18nProvider";
import { useVocabReview } from "@/hooks/vocab/useVocabReview";
import { VocabTable } from "@/components/page/learner/vocab/VocabTable";
import {
  VocabStrokeModal,
  type StrokeModalState,
  type StrokeAllItem,
} from "@/components/page/learner/vocab/VocabStrokeModal";
import type { VocabRow } from "@/lib/types/vocab";
import "@/components/page/learner/vocab/vocab-select.css";
import "./vocab-review.css";

const TRAINER_WORDS_KEY = "selectedVocabTrainerWords";
const HANZI_RE = /[一-鿿]/;

interface VocabReviewPageProps {
  // Mounted as a panel of the learner home rather than as its own route: the
  // back-to-dashboard link would point at the page it is already inside.
  embedded?: boolean;
  // Embedded start path: run the trainer in the panel with these rows instead of
  // stashing the selection and navigating to /learner/vocab-training-batch.
  onStart?: (rows: VocabRow[]) => void;
}

export function VocabReviewPage({ embedded = false, onStart }: VocabReviewPageProps = {}) {
  const { t } = useT();
  const router = useRouter();
  const review = useVocabReview();
  const [stroke, setStroke] = useState<StrokeModalState>(null);

  function startTraining() {
    if (review.selectedCount === 0) return;
    // Embedded: hand the rows straight to the panel. They are already normalized
    // trainer rows, so this also skips the /api/vocab/words resolve the standalone
    // route pays for.
    if (onStart) {
      onStart(review.selectedRows);
      return;
    }
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

  function openStrokeAll(rows: VocabRow[]) {
    const queue: StrokeAllItem[] = [];
    rows.forEach((row) => {
      const word = row.word || row.cn || "";
      [...word]
        .filter((ch) => HANZI_RE.test(ch))
        .forEach((ch) => queue.push({ ch, word, pinyin: row.pinyin || "" }));
    });
    if (queue.length) setStroke({ mode: "all", queue });
  }

  const showTable = review.status === "ready" && review.rows.length > 0;
  const stateMessage =
    review.status === "loading"
      ? t("vocab_review.loading")
      : review.status === "error"
        ? t("vocab_review.load_failed")
        : t("vocab_review.empty");

  return (
    <div className="vocab-select vocab-review">
      <div className="vocab-select-wrap">
        {!embedded && (
          <div className="vocab-top-link">
            <Link href="/learner">&larr; {t("picker.back_to_dashboard")}</Link>
          </div>
        )}

        <div className="vocab-content-card">
          <div className="vocab-table-header">
            <div className="review-title-block">
              <h1 className="review-heading">
                {t("vocab_review.heading")}
                {showTable && (
                  <span className="review-count">{review.rows.length}</span>
                )}
              </h1>
              <p className="review-subtitle">{t("vocab_review.subtitle")}</p>
            </div>
            {/* Not /vocab's `.vocab-action-buttons`: that row is built for three
                buttons and shrink-wraps around one, which leaves a lone button
                floating mid-card on a phone. Own class, same button styles. */}
            <div className="review-actions">
              <button
                type="button"
                className="btn action-primary review-start-btn"
                onClick={startTraining}
                disabled={review.selectedCount === 0}
              >
                {t("vocab_review.start_training", { count: review.selectedCount })}
              </button>
            </div>
          </div>

          {showTable ? (
            <VocabTable
              rows={review.rows}
              isSelected={review.isSelected}
              allOnPageSelected={review.allSelected}
              onToggleWord={review.toggleWord}
              // The review list is never paginated, so the table's visible rows
              // and the hook's loaded rows are the same set — shuffle reorders
              // them, it does not filter.
              onTogglePage={(_rows, checked) => review.toggleAll(checked)}
              onOpenStroke={(word, pinyin) => setStroke({ mode: "word", word, pinyin })}
              onStrokeAll={openStrokeAll}
            />
          ) : (
            <div className="vocab-table-state">{stateMessage}</div>
          )}

          {review.canLoadMore && (
            <div className="vocab-pagination">
              <button
                type="button"
                className="btn secondary"
                onClick={review.loadMore}
                disabled={review.loadingMore}
              >
                {t("vocab_review.load_more")}
              </button>
            </div>
          )}
        </div>
      </div>

      <VocabStrokeModal state={stroke} onClose={() => setStroke(null)} />
    </div>
  );
}
