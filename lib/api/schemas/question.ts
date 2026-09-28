// lib/api/schemas/question.ts
// Zod schema for POST /api/admin/question/query. Mirrors backend QuestionQuery.

import { z } from "zod";
import { paginationShape, filterStr } from "./pagination";

export const questionQuerySchema = z.object({
  ...paginationShape,
  category: filterStr(50),
  level: filterStr(20),
  lesson: filterStr(50),
  skill: filterStr(50),
  search: filterStr(100),
});
