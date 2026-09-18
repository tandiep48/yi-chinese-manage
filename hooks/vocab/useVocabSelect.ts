"use client";

// hooks/vocab/useVocabSelect.ts
// State machine for the learner vocab selection page. Ports the module-level
// state and the mode/filter reset cascades from
// Learning/web_app/static/vocab/vocab_select.js into a single hook:
//   mode -> (hsk) -> lessons -> parts -> table, plus debounced search, page
//   size / pagination, and the cross-page selected-word set used to launch
//   training.
//
// One intentional divergence from the legacy page: clearing the search box
// re-applies the current mode + filters (re-deriving the table or the right
// prompt) instead of always dropping back to the generic "choose filters"
// message. The legacy exitSearchMode() showed that prompt even in the history
// modes (unsure/unlearn/recent), which load with no filters — nonsensical there.

import { useCallback, useEffect, useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import { getPassages } from "@/lib/api/learner/lessons";
import {
  getVocabTable,
  getLearnedVocab,
  getSavedBooks,
  searchVocab,
} from "@/lib/api/learner/vocab";
import {
  DEFAULT_PAGE_SIZE,
  buildLessonOptions,
  buildPartOptions,
  groupPassagesByLesson,
  isHistoryMode,
  type MultiSelectOption,
  type PassageMeta,
} from "@/lib/vocab/vocabSelect";
import { useVocabTableState } from "./useVocabTableState";
import { useWordSelection } from "./useWordSelection";
import type { SavedBook, VocabMode } from "@/lib/types/vocab";

export function useVocabSelect() {
  const { t } = useT();

  const [mode, setModeState] = useState<VocabMode>("standard");
  const [hskLevel, setHskLevelState] = useState("");

  // Book mode: the books the user has saved words in, and the chosen one.
  const [bookOptions, setBookOptions] = useState<SavedBook[]>([]);
  const [selectedBook, setSelectedBook] = useState("");

  const [groupedPassages, setGroupedPassages] = useState<
    Record<string, PassageMeta[]>
  >({});
  const [lessonOptions, setLessonOptions] = useState<MultiSelectOption[]>([]);
  const [partOptions, setPartOptions] = useState<MultiSelectOption[]>([]);
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [selectedParts, setSelectedParts] = useState<string[]>([]);

  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);

  const {
    rows,
    setRows,
    page,
    setPage,
    totalPages,
    total,
    tableState,
    setTableState,
    beginRequest,
    setReady,
    setPrompt,
    setLoading,
  } = useVocabTableState(t("vocab.state_choose_filters"));

  const [searchQuery, setSearchQuery] = useState("");
  // Derived, not stored: we're "in search mode" whenever the box is non-empty.
  // This keeps the mode in lockstep with the input and avoids a setState-in-
  // effect just to flip it back when the query is cleared.
  const searchMode = searchQuery.trim().length > 0;

  const selection = useWordSelection(rows);

  const lessonLabel = useCallback(
    (lesson: string) =>
      lesson === "Other"
        ? t("vocab.other_label")
        : `${t("picker.lesson_prefix")} ${lesson}`,
    [t]
  );

  // ── Table loading (free / standard / book / unsure / unlearn / recent) ──────
  const loadTable = useCallback(
    async (targetPage: number) => {
      let selectedPassages: string[] = [];
      if (mode === "standard") selectedPassages = selectedParts;

      if (mode === "book" && !selectedBook) {
        setPrompt(t("vocab.choose_book"));
        return;
      }

      if (
        mode !== "book" &&
        !isHistoryMode(mode) &&
        (!hskLevel || (mode === "standard" && selectedPassages.length === 0))
      ) {
        setPrompt(
          t(
            mode === "standard"
              ? "vocab.choose_hsk_lesson_part"
              : "vocab.choose_hsk_only"
          )
        );
        return;
      }

      const isCurrent = beginRequest();
      setLoading(t("dashboard.loading_vocabulary"));
      try {
        const data =
          mode === "recent"
            ? await getLearnedVocab(targetPage, pageSize)
            : await getVocabTable({
                mode,
                hskLevel,
                passages: selectedPassages,
                bookCode: selectedBook,
                page: targetPage,
                pageSize,
              });
        if (!isCurrent()) return;
        if (!data.rows || data.rows.length === 0) {
          setPrompt(t("vocab.no_vocab_found"));
          return;
        }
        setReady(data);
      } catch {
        if (!isCurrent()) return;
        setPrompt(t("reading.failed_load_vocabulary"));
      }
    },
    [mode, hskLevel, selectedParts, selectedBook, pageSize, t, beginRequest, setPrompt, setLoading, setReady]
  );

  // Load the books the user has saved words in (Book mode picker). Soft-fails to
  // an empty list; prompts to pick a book, or that there are none yet.
  const loadSavedBooks = useCallback(async () => {
    const isCurrent = beginRequest();
    setLoading(t("dashboard.loading_vocabulary"));
    const books = await getSavedBooks();
    if (!isCurrent()) return;
    setBookOptions(books);
    setPrompt(t(books.length ? "vocab.choose_book" : "vocab.no_saved_books"));
  }, [t, beginRequest, setLoading, setPrompt]);

  // ── Search ─────────────────────────────────────────────────────────────────
  const runSearch = useCallback(
    async (query: string, targetPage: number) => {
      const isCurrent = beginRequest();
      setLoading(t("vocab.searching"));
      try {
        const data = await searchVocab(query, targetPage, pageSize);
        if (!isCurrent()) return;
        if (!data.rows || data.rows.length === 0) {
          setPrompt(t("vocab.no_results_for", { query }));
          return;
        }
        setReady(data);
      } catch {
        if (!isCurrent()) return;
        setPrompt(t("vocab.search_failed"));
      }
    },
    [pageSize, t, beginRequest, setPrompt, setLoading, setReady]
  );

  // Debounced search: a non-empty query runs a search after 300ms. Clearing the
  // box makes searchMode false, so the filter-load effect below restores the
  // current mode's table on its own — nothing to do here.
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) return;
    const timer = setTimeout(() => {
      setPage(1);
      runSearch(query, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, runSearch, setPage]);

  // ── Standard-mode passage loading (HSK -> lessons) ──────────────────────────
  const loadStandardLessons = useCallback(
    async (level: string) => {
      const isCurrent = beginRequest();
      setLoading(t("picker.loading_lessons"));
      try {
        const passages = await getPassages(level);
        if (!isCurrent()) return;
        const grouped = groupPassagesByLesson(passages);
        setGroupedPassages(grouped);
        const options = buildLessonOptions(grouped, lessonLabel);
        setLessonOptions(options);
        setPartOptions([]);
        setSelectedLessons([]);
        setSelectedParts([]);
        setRows([]);
        setTableState({
          status: "prompt",
          message: t(
            options.length ? "vocab.choose_lesson_and_part" : "vocab.no_lessons_found"
          ),
        });
      } catch {
        if (!isCurrent()) return;
        setPrompt(t("picker.failed_load_lessons"));
      }
    },
    [t, lessonLabel, beginRequest, setLoading, setPrompt, setRows, setTableState]
  );

  // ── Public handlers ─────────────────────────────────────────────────────────
  const setMode = useCallback(
    (next: VocabMode) => {
      setModeState(next);
      setHskLevelState("");
      setGroupedPassages({});
      setLessonOptions([]);
      setPartOptions([]);
      setSelectedLessons([]);
      setSelectedParts([]);
      setSelectedBook("");
      setBookOptions([]);
      setPage(1);
      setRows([]);
      if (isHistoryMode(next)) {
        setTableState({ status: "loading", message: t("dashboard.loading_vocabulary") });
      } else if (next === "book") {
        loadSavedBooks();
      } else {
        setTableState({ status: "prompt", message: t("vocab.state_choose_filters") });
      }
    },
    [t, loadSavedBooks, setPage, setRows, setTableState]
  );

  const setBook = useCallback(
    (bookCode: string) => {
      setSelectedBook(bookCode);
      setPage(1);
      // The load-effect reacts to selectedBook; an empty choice just re-prompts.
      if (!bookCode) setPrompt(t("vocab.choose_book"));
    },
    [t, setPage, setPrompt]
  );

  const setHskLevel = useCallback(
    (level: string) => {
      setHskLevelState(level);
      setSelectedLessons([]);
      setSelectedParts([]);
      setPartOptions([]);
      setPage(1);
      if (!level) {
        setPrompt(t("vocab.state_choose_filters"));
        return;
      }
      if (mode === "standard") loadStandardLessons(level);
      // free mode: the loadTable effect reacts to hskLevel.
    },
    [mode, t, loadStandardLessons, setPage, setPrompt]
  );

  const changeLessons = useCallback(
    (lessons: string[]) => {
      setSelectedLessons(lessons);
      setSelectedParts([]);
      setPage(1);
      if (lessons.length === 0) {
        setPartOptions([]);
        setPrompt(t("vocab.choose_lesson_and_part"));
        return;
      }
      const options = buildPartOptions(
        lessons,
        groupedPassages,
        lessonLabel,
        (part) => `${t("picker.part_prefix")} ${part}`
      );
      setPartOptions(options);
      setPrompt(t("vocab.choose_a_part"));
    },
    [groupedPassages, t, lessonLabel, setPage, setPrompt]
  );

  const changeParts = useCallback(
    (parts: string[]) => {
      setSelectedParts(parts);
      setPage(1);
    },
    [setPage]
  );

  const setPageSize = useCallback(
    (size: number) => {
      setPageSizeState(size || DEFAULT_PAGE_SIZE);
      setPage(1);
    },
    [setPage]
  );

  const goToPage = useCallback(
    (delta: number) => {
      const next = page + delta;
      if (next < 1 || next > totalPages) return;
      setPage(next);
      if (searchMode) {
        const query = searchQuery.trim();
        if (query) {
          runSearch(query, next);
          return;
        }
      }
      loadTable(next);
    },
    [page, totalPages, searchMode, searchQuery, runSearch, loadTable, setPage]
  );

  // React to the filter changes that should (re)load page 1 when not searching:
  // history-mode entry, free-mode HSK, standard-mode part selection, page-size
  // changes, and returning from search.
  useEffect(() => {
    if (searchMode) return;
    if (isHistoryMode(mode)) {
      loadTable(1);
      return;
    }
    if (mode === "book" && selectedBook) {
      loadTable(1);
      return;
    }
    if (mode === "free" && hskLevel) {
      loadTable(1);
      return;
    }
    if (mode === "standard" && selectedParts.length) {
      loadTable(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, hskLevel, selectedParts, selectedBook, pageSize, searchMode]);

  return {
    // filters
    mode,
    setMode,
    hskLevel,
    setHskLevel,
    isHistoryMode: isHistoryMode(mode),
    isBookMode: mode === "book",
    bookOptions,
    selectedBook,
    setBook,
    lessonOptions,
    partOptions,
    selectedLessons,
    changeLessons,
    selectedParts,
    changeParts,
    pageSize,
    setPageSize,
    // table
    rows,
    tableState,
    page,
    totalPages,
    total,
    goToPage,
    // search
    searchQuery,
    setSearchQuery,
    searchMode,
    // selection
    ...selection,
  };
}
