// lib/api/schemas/learner_vocab.ts
// Zod schemas for the learner vocab list/search reads that now POST a validated
// body to .../query. Mirror the backend models in
// Learning/web_app/routes/vocab/query_schemas.py and .../routes/user/query_schemas.py.

import { z } from "zod";
import { learnerPage, learnerPageSize, filterStr } from "./pagination";

export const VOCAB_TABLE_MODES = ["free", "standard", "book", "unlearn", "unsure"] as const;

export const vocabTableQuerySchema = z.object({
  mode: z.enum(VOCAB_TABLE_MODES).default("free"),
  hsk_level: filterStr(20),
  lesson: filterStr(50),
  part: filterStr(50),
  passages: z.array(z.string()).max(1000).optional(),
  book_code: filterStr(50),
  page: learnerPage(),
  page_size: learnerPageSize(20),
});

export const vocabReviewQuerySchema = z.object({
  page: learnerPage(),
  page_size: learnerPageSize(100),
});

export const vocabSearchQuerySchema = z.object({
  q: filterStr(100),
  page: learnerPage(),
  page_size: learnerPageSize(20),
});

export const learnedVocabQuerySchema = z.object({
  page: learnerPage(),
  page_size: learnerPageSize(24),
});
