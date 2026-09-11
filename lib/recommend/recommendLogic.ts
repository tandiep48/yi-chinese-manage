// lib/recommend/recommendLogic.ts
// Pure, framework-agnostic logic for the Recommend page — ports the filtering,
// pagination and multi-select identity from Learning/web_app/static/recommend/
// recommend.js + static/shared/recommend_cards.js. Kept side-effect-free so it
// can be unit-tested; the hook (useRecommend) and components own state and i18n.

import type {
  PracticeMultiItem,
  RecommendedPractice,
  RecommendStatus,
} from "@/lib/types/types";

export const RECOMMEND_PAGE_SIZE = 10;

export type LevelFilter = "all" | "1" | "2" | "3" | "4" | "5" | "6";
export type SkillFilter = "all" | "listening" | "reading";
export type CategoryFilter = "all" | "practice" | "exam";
export type StatusFilter = "all" | RecommendStatus;

export interface RecommendFilters {
  level: LevelFilter;
  skill: SkillFilter;
  category: CategoryFilter;
  status: StatusFilter;
}

// Stable identity for a recommendation, matching recommendationKey() in
// recommend_cards.js — category|level|lesson|progress. Used for selection dedupe.
export function recommendationKey(item: {
  category?: string | null;
  level: number | string;
  lesson: number | string;
  progress: string;
}): string {
  return [item.category || "practice", item.level, item.lesson, item.progress].join(
    "|"
  );
}

// Mirrors renderRecommendations()'s filter: "all" passes everything, level is a
// loose (==) match since the option values are strings and rec.level is a number.
export function filterRecommendations(
  recs: RecommendedPractice[],
  filters: RecommendFilters
): RecommendedPractice[] {
  return recs.filter((r) => {
    const matchLevel =
      filters.level === "all" || String(r.level) === String(filters.level);
    const matchSkill = filters.skill === "all" || r.skill === filters.skill;
    const matchCategory =
      filters.category === "all" || r.category === filters.category;
    const status: RecommendStatus = (r.status as RecommendStatus) || "Not start";
    const matchStatus = filters.status === "all" || status === filters.status;
    return matchLevel && matchSkill && matchCategory && matchStatus;
  });
}

// Clamp a 1-based page to the valid range for a given item count. Empty lists
// stay on page 1 (legacy keeps currentPage but shows the empty state).
export function clampPage(page: number, totalItems: number): number {
  const totalPages = Math.max(1, Math.ceil(totalItems / RECOMMEND_PAGE_SIZE));
  if (page > totalPages) return totalPages;
  if (page < 1) return 1;
  return page;
}

export function pageSlice<T>(items: T[], page: number): T[] {
  const start = (page - 1) * RECOMMEND_PAGE_SIZE;
  return items.slice(start, start + RECOMMEND_PAGE_SIZE);
}

// The condensed page-number model from getPageNumbers() in recommend.js: up to 7
// buttons with "..." gaps for longer ranges.
export type PageToken = number | "...";

export function getPageNumbers(current: number, total: number): PageToken[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3)
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}

// Parse a progress token ("3" or "3-5") into a descriptor the component can
// translate (recommend.question_single / questions_range). Returns null for "-".
export type ProgressDescriptor =
  | { kind: "none" }
  | { kind: "single"; n: string }
  | { kind: "range"; a: string; b: string };

export function parseProgress(progress: string | null | undefined): ProgressDescriptor {
  if (!progress) return { kind: "none" };
  const text = String(progress);
  if (text.includes("-")) {
    const [a, b] = text.split("-");
    return { kind: "range", a, b };
  }
  return { kind: "single", n: text };
}

// Reduce a recommendation to the queue item stored in sessionStorage before
// jumping to /practice/multi (matches setSelected()'s stored shape).
export function toMultiItem(rec: RecommendedPractice): PracticeMultiItem {
  return {
    level: rec.level,
    lesson: rec.lesson,
    progress: rec.progress,
    category: (rec.category as PracticeMultiItem["category"]) || "practice",
  };
}
