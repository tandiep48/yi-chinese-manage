"use client";

// hooks/useVocabSelect.ts
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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useT } from "@/components/i18n/I18nProvider";
import { getPassages } from "@/lib/api/lessons";
import {
  getVocabTable,
  getLearnedVocab,
  getSavedBooks,
  searchVocab,
} from "@/lib/api/learnerVocab";
import type { PickerPassage } from "@/lib/types/lesson";
import type { SavedBook, VocabMode, VocabRow, VocabTableResponse } from "@/lib/types/vocab";

export interface MultiSelectOption {
  value: string;
  label: string;
  group?: string | null;
}

// A prompt/loading message (already translated) or the loaded table.
export interface TableState {
  status: "prompt" | "loading" | "ready";
  message: string;
}

const HISTORY_MODES: ReadonlySet<VocabMode> = new Set([
  "unsure",
  "unlearn",
  "recent",
]);

const DEFAULT_PAGE_SIZE = 20;

interface PassageMeta extends PickerPassage {
  lesson: string;
  part: string;
}

// 'Other' sinks to the bottom; the rest sort numerically by lesson/part number.
function numericSort(a: string, b: string): number {
  if (a === "Other") return 1;
  if (b === "Other") return -1;
  return Number(a) - Number(b);
}

function isHistoryMode(mode: VocabMode): boolean {
  return HISTORY_MODES.has(mode);
}

function wordKey(row: VocabRow): string {
  return row.word || row.cn || "";
}

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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [rows, setRows] = useState<VocabRow[]>([]);
  const [tableState, setTableState] = useState<TableState>(() => ({
    status: "prompt",
    message: t("vocab.state_choose_filters"),
  }));

  const [searchQuery, setSearchQuery] = useState("");
  // Derived, not stored: we're "in search mode" whenever the box is non-empty.
  // This keeps the mode in lockstep with the input and avoids a setState-in-
  // effect just to flip it back when the query is cleared.
  const searchMode = searchQuery.trim().length > 0;

  const [selectedWords, setSelectedWords] = useState<Map<string, VocabRow>>(
    () => new Map()
  );

  // Guards each async load so a stale response can't overwrite a newer one.
  const requestSeq = useRef(0);

  const lessonLabel = useCallback(
    (lesson: string) =>
      lesson === "Other"
        ? t("vocab.other_label")
        : `${t("picker.lesson_prefix")} ${lesson}`,
    [t]
  );

  const setReady = useCallback((data: VocabTableResponse) => {
    setRows(data.rows ?? []);
    setPage(data.page ?? 1);
    setTotalPages(data.total_pages ?? 1);
    setTotal(data.total ?? 0);
    setTableState({ status: "ready", message: "" });
  }, []);

  const setPrompt = useCallback((message: string) => {
    setRows([]);
    setTotal(0);
    setTableState({ status: "prompt", message });
  }, []);

  const setLoading = useCallback((message: string) => {
    setTableState({ status: "loading", message });
  }, []);

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

      const seq = ++requestSeq.current;
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
        if (seq !== requestSeq.current) return;
        if (!data.rows || data.rows.length === 0) {
          setPrompt(t("vocab.no_vocab_found"));
          return;
        }
        setReady(data);
      } catch {
        if (seq !== requestSeq.current) return;
        setPrompt(t("reading.failed_load_vocabulary"));
      }
    },
    [mode, hskLevel, selectedParts, selectedBook, pageSize, t, setPrompt, setLoading, setReady]
  );

  // Load the books the user has saved words in (Book mode picker). Soft-fails to
  // an empty list; prompts to pick a book, or that there are none yet.
  const loadSavedBooks = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(t("dashboard.loading_vocabulary"));
    const books = await getSavedBooks();
    if (seq !== requestSeq.current) return;
    setBookOptions(books);
    setPrompt(t(books.length ? "vocab.choose_book" : "vocab.no_saved_books"));
  }, [t, setLoading, setPrompt]);

  // ── Search ─────────────────────────────────────────────────────────────────
  const runSearch = useCallback(
    async (query: string, targetPage: number) => {
      const seq = ++requestSeq.current;
      setLoading(t("vocab.searching"));
      try {
        const data = await searchVocab(query, targetPage, pageSize);
        if (seq !== requestSeq.current) return;
        if (!data.rows || data.rows.length === 0) {
          setPrompt(t("vocab.no_results_for", { query }));
          return;
        }
        setReady(data);
      } catch {
        if (seq !== requestSeq.current) return;
        setPrompt(t("vocab.search_failed"));
      }
    },
    [pageSize, t, setPrompt, setLoading, setReady]
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
  }, [searchQuery, runSearch]);

  // ── Standard-mode passage loading (HSK -> lessons) ──────────────────────────
  const loadStandardLessons = useCallback(
    async (level: string) => {
      const seq = ++requestSeq.current;
      setLoading(t("picker.loading_lessons"));
      try {
        const passages = await getPassages(level);
        if (seq !== requestSeq.current) return;
        const grouped: Record<string, PassageMeta[]> = {};
        passages.forEach((passage) => {
          const parts = String(passage.passage_id || "").split("_");
          const lesson = parts.length >= 2 ? parts[1] : "Other";
          const part = parts.length >= 3 ? parts[2] : passage.passage_id;
          (grouped[lesson] ||= []).push({ ...passage, lesson, part });
        });
        setGroupedPassages(grouped);
        const options = Object.keys(grouped)
          .sort(numericSort)
          .map<MultiSelectOption>((lesson) => ({
            value: lesson,
            label: lessonLabel(lesson),
          }));
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
        if (seq !== requestSeq.current) return;
        setPrompt(t("picker.failed_load_lessons"));
      }
    },
    [t, lessonLabel, setLoading, setPrompt]
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
    [t, loadSavedBooks]
  );

  const setBook = useCallback(
    (bookCode: string) => {
      setSelectedBook(bookCode);
      setPage(1);
      // The load-effect reacts to selectedBook; an empty choice just re-prompts.
      if (!bookCode) setPrompt(t("vocab.choose_book"));
    },
    [t, setPrompt]
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
    [mode, t, loadStandardLessons, setPrompt]
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
      // Each part option carries its full passage_id; when several lessons are
      // selected the parts are grouped by lesson so they stay distinguishable.
      const showGroups = lessons.length > 1;
      const options: MultiSelectOption[] = [];
      [...lessons].sort(numericSort).forEach((lesson) => {
        const passages = groupedPassages[lesson];
        if (!passages?.length) return;
        const groupLabel = lessonLabel(lesson);
        [...passages]
          .sort((a, b) => Number(a.part) - Number(b.part))
          .forEach((passage) => {
            options.push({
              value: passage.passage_id,
              label: `${t("picker.part_prefix")} ${passage.part}`,
              group: showGroups ? groupLabel : null,
            });
          });
      });
      setPartOptions(options);
      setPrompt(t("vocab.choose_a_part"));
    },
    [groupedPassages, t, lessonLabel, setPrompt]
  );

  const changeParts = useCallback((parts: string[]) => {
    setSelectedParts(parts);
    setPage(1);
  }, []);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size || DEFAULT_PAGE_SIZE);
    setPage(1);
  }, []);

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
    [page, totalPages, searchMode, searchQuery, runSearch, loadTable]
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

  // ── Selection ────────────────────────────────────────────────────────────────
  const toggleWord = useCallback((row: VocabRow, checked: boolean) => {
    setSelectedWords((prev) => {
      const next = new Map(prev);
      const key = wordKey(row);
      if (checked) next.set(key, row);
      else next.delete(key);
      return next;
    });
  }, []);

  const togglePage = useCallback((pageRows: VocabRow[], checked: boolean) => {
    setSelectedWords((prev) => {
      const next = new Map(prev);
      pageRows.forEach((row) => {
        const key = wordKey(row);
        if (checked) next.set(key, row);
        else next.delete(key);
      });
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedWords(new Map());
  }, []);

  const isSelected = useCallback(
    (row: VocabRow) => selectedWords.has(wordKey(row)),
    [selectedWords]
  );

  const allOnPageSelected = useMemo(
    () => rows.length > 0 && rows.every((row) => selectedWords.has(wordKey(row))),
    [rows, selectedWords]
  );

  const selectedWordList = useMemo(
    () => Array.from(selectedWords.values()),
    [selectedWords]
  );

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
    toggleWord,
    togglePage,
    clearSelection,
    isSelected,
    allOnPageSelected,
    selectedCount: selectedWords.size,
    selectedWordList,
  };
}
