// lib/api/schemas/passage.ts
// Zod schema for POST /api/admin/passage/query. Mirrors backend PassageQuery.

import { z } from "zod";
import { paginationShape, HSK_LEVELS } from "./pagination";

export const passageQuerySchema = z.object({
  ...paginationShape,
  hsk_level: z.enum(HSK_LEVELS).optional(),
});
