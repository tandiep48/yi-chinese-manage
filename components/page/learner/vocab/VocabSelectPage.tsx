"use client";

// components/page/learner/vocab/VocabSelectPage.tsx
// Learner vocabulary selection page — the training-selection table. Ported from
// Learning/web_app/templates/vocab/vocab.html + static/vocab/vocab_select.js.
// Composes the mode picker, search, filter bar, study table, pagination and the
// stroke-order modal on top of the useVocabSelect state machine.
//
// Flash Cards stashes the current selection in sessionStorage and opens
// /vocab-learning. Start Training opens the train-type picker, stashes the
// selection + chosen skills, and opens the batch trainer (/vocab-training-batch),
// mirroring vocab_select.js.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useT } from "@/components/i18n/I18nProvider";
import { useVocabSelect } from "@/hooks/useVocabSelect";
import { TrainTypePicker } from "@/components/page/learner/trainer/TrainTypePicker";
import type { VocabMode, VocabRow } from "@/lib/types/types";
import { VocabFilterBar } from "./VocabFilterBar";
import { VocabTable } from "./VocabTable";
import {
  VocabStrokeModal,
  type StrokeModalState,
  type StrokeAllItem,
} from "./VocabStrokeModal";

const HANZI_RE = /[一-鿿]/;
const MODES: VocabMode[] = ["free", "standard", "book", "unsure", "unlearn", "recent"];

const FLASHCARD_SELECTION_KEY = "selectedVocabFlashcards";
const TRAINER_WORDS_KEY = "selectedVocabTrainerWords";
const TRAINER_TYPES_KEY = "vocabTrainerActivityTypes";

export function VocabSelectPage() {
  const { t } = useT();
  const router = useRouter();
  const vocab = useVocabSelect();
  const [stroke, setStroke] = useState<StrokeModalState>(null);
  const [trainPickerOpen, setTrainPickerOpen] = useState(false);

  function startTraining(types: string[]) {
    setTrainPickerOpen(false);
    try {
      sessionStorage.setItem(
        TRAINER_WORDS_KEY,
        JSON.stringify(vocab.selectedWordList.map((row) => row.word))
      );
      sessionStorage.setItem(TRAINER_TYPES_KEY, JSON.stringify(types));
    } catch {
      // sessionStorage unavailable (private mode); the trainer shows its empty
      // state / redirects rather than crashing.
    }
    router.push("/vocab-training-batch");
  }

  function openFlashcards() {
    if (vocab.selectedCount === 0) return;
    try {
      sessionStorage.setItem(
        FLASHCARD_SELECTION_KEY,
        JSON.stringify(vocab.selectedWordList)
      );
    } catch {
      // sessionStorage unavailable (private mode); the target page shows an
      // empty state rather than crashing.
    }
    router.push("/vocab-learning?source=selection");
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

  const showTable = vocab.tableState.status === "ready" && vocab.rows.length > 0;

  return (
    <div className="vocab-select">
      <div className="vocab-select-wrap">
        <div className="vocab-top-link">
          <Link href="/">&larr; {t("picker.back_to_dashboard")}</Link>
        </div>

        <div className="vocab-content-card">
          <div className="vocab-table-header">
            <div className="vocab-mode-select-wrap">
              <label htmlFor="mode-select" className="vocab-mode-label">
                {t("vocab.mode_label")}
              </label>
              <select
                id="mode-select"
                className="vocab-mode-select"
                value={vocab.mode}
                onChange={(e) => vocab.setMode(e.target.value as VocabMode)}
              >
                {MODES.map((m) => (
                  <option key={m} value={m}>
                    {t(`vocab.mode_${m}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="vocab-action-buttons">
              {vocab.selectedCount > 0 && (
                <span className="selection-count">
                  {t("vocab.n_selected", { n: vocab.selectedCount })}
                </span>
              )}
              <button
                type="button"
                className="btn action-outline"
                onClick={vocab.clearSelection}
                disabled={vocab.selectedCount === 0}
              >
                {t("vocab.clear_selection")}
              </button>
              <button
                type="button"
                className="btn action-secondary"
                onClick={openFlashcards}
                disabled={vocab.selectedCount === 0}
              >
                {t("reading.flash_cards")}
              </button>
              <button
                type="button"
                className="btn action-primary"
                onClick={() => setTrainPickerOpen(true)}
                disabled={vocab.selectedCount === 0}
              >
                {t("vocab.start_training")}
              </button>
            </div>
          </div>

          <div className="vocab-search-row">
            <div className="vocab-search-wrap">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="vocab-search-icon"
                aria-hidden
              />
              <input
                type="text"
                className="vocab-search-input"
                placeholder={t("vocab.search_placeholder")}
                value={vocab.searchQuery}
                onChange={(e) => vocab.setSearchQuery(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              {vocab.searchQuery && (
                <button
                  type="button"
                  className="vocab-search-clear"
                  onClick={() => vocab.setSearchQuery("")}
                  aria-label={t("vocab.clear_search_aria")}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              )}
            </div>
          </div>

          {!vocab.searchMode && (
            <VocabFilterBar
              mode={vocab.mode}
              isHistoryMode={vocab.isHistoryMode}
              isBookMode={vocab.isBookMode}
              hskLevel={vocab.hskLevel}
              onHskChange={vocab.setHskLevel}
              bookOptions={vocab.bookOptions}
              selectedBook={vocab.selectedBook}
              onBookChange={vocab.setBook}
              lessonOptions={vocab.lessonOptions}
              selectedLessons={vocab.selectedLessons}
              onLessonsChange={vocab.changeLessons}
              partOptions={vocab.partOptions}
              selectedParts={vocab.selectedParts}
              onPartsChange={vocab.changeParts}
              pageSize={vocab.pageSize}
              onPageSizeChange={vocab.setPageSize}
            />
          )}

          {showTable ? (
            <VocabTable
              rows={vocab.rows}
              isSelected={vocab.isSelected}
              allOnPageSelected={vocab.allOnPageSelected}
              onToggleWord={vocab.toggleWord}
              onTogglePage={vocab.togglePage}
              onOpenStroke={(word, pinyin) => setStroke({ mode: "word", word, pinyin })}
              onStrokeAll={openStrokeAll}
            />
          ) : (
            <div className="vocab-table-state">{vocab.tableState.message}</div>
          )}

          {showTable && (
            <div className="vocab-pagination">
              <button
                type="button"
                className="btn secondary"
                onClick={() => vocab.goToPage(-1)}
                disabled={vocab.page <= 1}
              >
                {t("reading.prev")}
              </button>
              <span>
                {t("vocab.page_status_with_count", {
                  current: vocab.page,
                  total: vocab.totalPages,
                  count: vocab.total,
                })}
              </span>
              <button
                type="button"
                className="btn secondary"
                onClick={() => vocab.goToPage(1)}
                disabled={vocab.page >= vocab.totalPages}
              >
                {t("reading.next")}
              </button>
            </div>
          )}
        </div>
      </div>

      <VocabStrokeModal state={stroke} onClose={() => setStroke(null)} />

      {trainPickerOpen && (
        <TrainTypePicker
          engine="vocab"
          onStart={startTraining}
          onCancel={() => setTrainPickerOpen(false)}
        />
      )}
    </div>
  );
}
