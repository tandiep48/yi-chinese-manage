"use client";

// hooks/vocab/useVocabTableState.ts
// What the vocab selection table is currently showing — its rows, pagination,
// and whether it holds a prompt, a loading message or data — plus the guard
// that keeps a slow response from overwriting a newer one.
//
// Every loader in useVocabSelect goes through the same three outcomes (ready /
// prompt / loading) and the same sequence guard, so they live here rather than
// being repeated per loader.

import { useCallback, useRef, useState } from "react";
import type { TableState } from "@/lib/vocab/vocabSelect";
import type { VocabRow, VocabTableResponse } from "@/lib/types/vocab";

export function useVocabTableState(initialMessage: string) {
  const [rows, setRows] = useState<VocabRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [tableState, setTableState] = useState<TableState>(() => ({
    status: "prompt",
    message: initialMessage,
  }));

  // Guards each async load so a stale response can't overwrite a newer one.
  const requestSeq = useRef(0);

  // Claim the table for a new request; the returned check tells the caller
  // whether it is still the most recent one once its await resolves.
  const beginRequest = useCallback(() => {
    const seq = ++requestSeq.current;
    return () => seq === requestSeq.current;
  }, []);

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

  return {
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
  };
}
