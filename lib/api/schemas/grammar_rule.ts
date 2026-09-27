// lib/api/schemas/grammar_rule.ts
// Zod schema for POST /api/admin/grammar_rule/query. Mirrors backend
// GrammarRuleQuery.

import { z } from "zod";
import { paginationShape, filterStr } from "./pagination";

export const grammarRuleQuerySchema = z.object({
  ...paginationShape,
  grammar_id: filterStr(50),
  type: z.number().int().optional(),
});
