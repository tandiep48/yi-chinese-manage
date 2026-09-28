// lib/api/schemas/practice.ts
// Zod schema for the practice-history read that now POSTs a validated body to
// /api/practice/history/query. Mirrors backend PracticeHistoryQuery. The filter
// values stay permissive (the backend normalizes level 'all'/1..6, category,
// sort) — the schema only bounds structure.

import { z } from "zod";
import { learnerPage, filterStr } from "./pagination";

export const practiceHistoryQuerySchema = z.object({
  level: filterStr(20),
  category: filterStr(20),
  sort: filterStr(20),
  page: learnerPage(),
});
