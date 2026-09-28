// lib/api/schemas/grammar_context.ts
// Zod schema for POST /api/admin/grammar_context/query. Mirrors backend
// GrammarContextQuery.

import { z } from "zod";
import { paginationShape, filterStr } from "./pagination";

export const grammarContextQuerySchema = z.object({
  ...paginationShape,
  grammar_id: filterStr(50),
});
