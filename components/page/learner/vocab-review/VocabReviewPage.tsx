"use client";

// components/page/learner/vocab-review/VocabReviewPage.tsx
// Saved-word review page — the target of the dashboard's "Review" card. A
// watch-only word browser (no selection, no trainer hand-off): the learner reads
// through their words with the vocabulary page's study tools, nothing more. Two
// tabs pick which list is shown:
//
//   "Recent learn word"  the words mastered most recently (capped at 100)
//   "Review word"        unlearned ∪ unsure words, most recently practised first
//                        (capped at 100)
//
// The layout is the vocabulary page's, not a second one: this mounts the same
// `.vocab-select` shell (vocab-select.css) and the same VocabTable / VocabCardList
// + stroke modal that /learner/vocab does, so review gets that page's study tools
// — column hide, per-cell reveal, shuffle, play-all, stroke order — for free, with
// its selection UI turned off (`selectable={false}`). Only what is genuinely
// different lives here: the heading block, the tab switch, the total count, and the
// review-scoped numbered pager (50 words per page, at most two pages).
//
// `.vocab-review` is a second class on the SAME element, never a wrapper, and
// vocab-review.css styles only leaf classes that vocab-select.css and
// vocab-table.css do not define — no two rules can tie at (0,2,0) (§2).

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { useVocabReview, REVIEW_PAGE_SIZE, type ReviewSource } from "@/hooks/vocab/useVocabReview";
import { useMediaQuery } from "@/hooks/shared/useMediaQuery";
import { getPageNumbers } from "@/lib/recommend/recommendLogic";
import { VocabTable } from "@/components/page/learner/vocab/VocabTable";
import { VocabCardList } from "@/components/page/learner/vocab/VocabCardList";
import {
  VocabStrokeModal,
  type StrokeModalState,
  type StrokeAllItem,
} from "@/components/page/learner/vocab/VocabStrokeModal";
import type { VocabRow } from "@/lib/types/vocab";
import "@/components/page/learner/vocab/vocab-select.css";
import "./vocab-review.css";

const HANZI_RE = /[一-鿿]/;

const TABS: { source: ReviewSource; label: string }[] = [
  { source: "recent", label: "vocab_review.tab_recent" },
  { source: "review", label: "vocab_review.tab_review" },
];

interface VocabReviewPageProps {
  // Mounted as a panel of the learner home rather than as its own route: the
  // back-to-dashboard link would point at the page it is already inside.
  embedded?: boolean;
}

export function VocabReviewPage({ embedded = false }: VocabReviewPageProps = {}) {
  const { t } = useT();
  // Opens on the "Recent learn word" tab.
  const review = useVocabReview("recent");
  const [stroke, setStroke] = useState<StrokeModalState>(null);
  // Phones get the card view (no sideways scrolling); desktop keeps the table.
  const useCards = useMediaQuery("(max-width: 767px)");

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
  const emptyKey =
    review.source === "recent" ? "vocab_review.empty_recent" : "vocab_review.empty_review";
  const stateMessage =
    review.status === "loading"
      ? t("vocab_review.loading")
      : review.status === "error"
        ? t("vocab_review.load_failed")
        : t(emptyKey);

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
                {showTable && <span className="review-count">{review.totalItems}</span>}
              </h1>
              <p className="review-subtitle">
                {t(
                  review.source === "recent"
                    ? "vocab_review.subtitle_recent"
                    : "vocab_review.subtitle_review"
                )}
              </p>
            </div>
            {/* The two sources as a tab switch. Own leaf classes (§2). */}
            <div className="review-tabs" role="tablist" aria-label={t("vocab_review.heading")}>
              {TABS.map((tab) => (
                <button
                  key={tab.source}
                  type="button"
                  role="tab"
                  aria-selected={review.source === tab.source}
                  className={`review-tab${review.source === tab.source ? " is-active" : ""}`}
                  onClick={() => review.setSource(tab.source)}
                >
                  {t(tab.label)}
                </button>
              ))}
            </div>
          </div>

          {showTable ? (
            useCards ? (
              <VocabCardList
                rows={review.rows}
                selectable={false}
                onOpenStroke={(word, pinyin) => setStroke({ mode: "word", word, pinyin })}
              />
            ) : (
              <VocabTable
                rows={review.rows}
                selectable={false}
                onOpenStroke={(word, pinyin) => setStroke({ mode: "word", word, pinyin })}
                onStrokeAll={openStrokeAll}
              />
            )
          ) : (
            <div className="vocab-table-state">{stateMessage}</div>
          )}

          {showTable && review.totalPages > 1 && (
            <div className="review-pagination">
              <button
                type="button"
                className="review-page-btn"
                aria-label={t("vocab_review.prev_page")}
                disabled={review.page <= 1 || review.navigating}
                onClick={() => review.goToPage(review.page - 1)}
              >
                <FontAwesomeIcon icon={faChevronLeft} aria-hidden />
              </button>

              {getPageNumbers(review.page, review.totalPages).map((tok, i) =>
                tok === "..." ? (
                  <span key={`e${i}`} className="review-page-ellipsis">
                    …
                  </span>
                ) : (
                  <button
                    key={tok}
                    type="button"
                    className={`review-page-btn${tok === review.page ? " is-active" : ""}`}
                    aria-current={tok === review.page ? "page" : undefined}
                    disabled={review.navigating}
                    onClick={() => review.goToPage(tok)}
                  >
                    {tok}
                  </button>
                )
              )}

              <button
                type="button"
                className="review-page-btn"
                aria-label={t("vocab_review.next_page")}
                disabled={review.page >= review.totalPages || review.navigating}
                onClick={() => review.goToPage(review.page + 1)}
              >
                <FontAwesomeIcon icon={faChevronRight} aria-hidden />
              </button>

              <span className="review-page-info">
                {t("vocab_review.page_range", {
                  start: (review.page - 1) * REVIEW_PAGE_SIZE + 1,
                  end: Math.min(review.page * REVIEW_PAGE_SIZE, review.totalItems),
                  total: review.totalItems,
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      <VocabStrokeModal state={stroke} onClose={() => setStroke(null)} />
    </div>
  );
}
