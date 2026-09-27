// lib/api/schemas/user.ts
// Zod schema for POST /api/admin/user/query. Mirrors backend UserQuery.

import { z } from "zod";
import { paginationShape, filterStr } from "./pagination";

export const userQuerySchema = z.object({
  ...paginationShape,
  search: filterStr(100),
});
