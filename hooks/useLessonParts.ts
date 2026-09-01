"use client";

// hooks/useLessonParts.ts
// Parts of the lesson the given passage belongs to, for the lesson-study
// sidebar. Ported from loadSidebarParts()/loadSidebarBookParts() in
// Learning/web_app/static/shared/sidebar.js: HSK passages come from the picker
// endpoints (with progress), book passages from the book detail endpoint (no
// progress).

import { useEffect, useState } from "react";
import { getPassages, getPickerProgress } from "@/lib/api/lessons";
import { getLearnerBook } from "@/lib/api/learnerBooks";
import {
  groupPassagesByLesson,
  sortPartsByNumber,
  toProgress,
  isBookPassageId,
  isNumberPart,
  hskLevelFromPassageId,
  type Progress,
} from "@/lib/lessons/lessons";

export interface SidebarPart {
  passageId: string;
  partNum: string; // "2", or "" for the number part (rendered as "#")
  isNumber: boolean;
  title?: string | null;
  progress: Progress | null; // null for book parts (no mini-stats)
}

export interface LessonPartsHeader {
  badge: string; // "HSK2" (HSK) or book code
  lessonNum: string; // "2"
  isBook: boolean;
}

interface UseLessonPartsReturn {
  loading: boolean;
  error: string | null;
  parts: SidebarPart[];
  header: LessonPartsHeader | null;
}

function partNumberOf(passageId: string): string {
  const seg = passageId.split("_");
  return seg.length > 2 ? seg[2] : "1";
}

export function useLessonParts(passageId: string): UseLessonPartsReturn {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parts, setParts] = useState<SidebarPart[]>([]);
  const [header, setHeader] = useState<LessonPartsHeader | null>(null);

  useEffect(() => {
    let cancelled = false;
    const seg = passageId.split("_");
    if (!passageId || seg.length < 2) {
      setLoading(false);
      setError("invalid");
      setParts([]);
      setHeader(null);
      return;
    }

    const prefix = seg[0];
    const lessonNum = seg[1];
    const book = isBookPassageId(passageId);
    setLoading(true);
    setError(null);
    setHeader({
      badge: book ? prefix : hskLevelFromPassageId(passageId),
      lessonNum,
      isBook: book,
    });

    const run = book ? loadBookParts(prefix, lessonNum) : loadHskParts(passageId, lessonNum);
    run
      .then((list) => !cancelled && setParts(list))
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "failed");
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [passageId]);

  return { loading, error, parts, header };
}

async function loadHskParts(passageId: string, lessonNum: string): Promise<SidebarPart[]> {
  const hskLevel = hskLevelFromPassageId(passageId);
  const [passages, progress] = await Promise.all([
    getPassages(hskLevel),
    getPickerProgress(hskLevel),
  ]);

  const grouped = groupPassagesByLesson(hskLevel, passages);
  const lessonParts = sortPartsByNumber(grouped[lessonNum] ?? []);
  const partsProgress = progress?.parts ?? {};

  return lessonParts.map((p) => ({
    passageId: p.passage_id,
    partNum: isNumberPart(p.passage_id) ? "" : partNumberOf(p.passage_id),
    isNumber: isNumberPart(p.passage_id),
    title: p.title,
    progress: partsProgress[p.passage_id] ? toProgress(partsProgress[p.passage_id]) : null,
  }));
}

async function loadBookParts(bookCode: string, lessonNum: string): Promise<SidebarPart[]> {
  const data = await getLearnerBook(bookCode);
  const lesson = (data.lessons ?? []).find((l) => String(l.lesson) === String(lessonNum));
  const parts = [...(lesson?.parts ?? [])].sort(
    (a, b) => (parseInt(String(a.part), 10) || 0) - (parseInt(String(b.part), 10) || 0)
  );

  return parts.map((p) => ({
    passageId: p.passage_id,
    partNum: String(p.part),
    isNumber: false,
    title: null,
    progress: null,
  }));
}
