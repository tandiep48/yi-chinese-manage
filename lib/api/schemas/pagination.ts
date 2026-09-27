// lib/api/schemas/pagination.ts
// Shared zod building blocks for the admin "query" request bodies, mirroring the
// backend PaginatedQuery base (Learning/web_app/entity/query_schemas.py). Each
// resource schema spreads `paginationShape` and adds its own filters.

import { z } from "zod";

export const HSK_LEVELS = ["HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6"] as const;

export const paginationShape = {
  page: z.number().int().min(1).default(1),
  page_size: z.number().int().min(1).max(100).default(20),
};

// An optional filter string: trimmed, dropped entirely when blank, else bounded.
export const filterStr = (max: number) => z.string().trim().min(1).max(max).optional();

// Learner reads keep their endpoint's own page-size cap (the helper clamps), so
// the schema only sanity-bounds it — the vocab-select UI offers sizes up to 1000.
export const learnerPage = () => z.number().int().min(1).default(1);
export const learnerPageSize = (dflt: number) => z.number().int().min(1).max(1000).default(dflt);
