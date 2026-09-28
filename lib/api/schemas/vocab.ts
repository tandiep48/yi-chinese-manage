// lib/api/schemas/vocab.ts
// Zod schema for the admin vocab "query" body. Mirrors the backend VocabQuery
// (Learning/web_app/entity/vocabulary/schemas.py) so the filter is validated in
// the browser before it is POSTed to /api/admin/vocab/query.

import { z } from "zod";
import { paginationShape, filterStr, HSK_LEVELS } from "./pagination";

export { HSK_LEVELS };

export const vocabQuerySchema = z.object({
  ...paginationShape,
  hsk_level: z.enum(HSK_LEVELS).optional(),
  search: filterStr(100),
});

export type VocabQueryInput = z.input<typeof vocabQuerySchema>;
export type VocabQuery = z.output<typeof vocabQuerySchema>;
