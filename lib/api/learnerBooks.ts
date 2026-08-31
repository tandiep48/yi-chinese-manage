// lib/api/learnerBooks.ts
// Learner-facing Books browsing endpoints (Books tab of the learning page).
// These are the raw (non-enveloped) JSON endpoints the Jinja learning page used
// (Learning/web_app/static/learning/learning.js), distinct from the admin book
// CRUD in lib/api/book.ts (/api/admin/book). Do not merge the two.

import type { LearnerBookSummary, LearnerBookDetail } from "@/lib/types/types";
import { legacyApiFetch } from "./client";

export function getLearnerBooks(): Promise<LearnerBookSummary[]> {
  return legacyApiFetch<{ books: LearnerBookSummary[] }>("/api/lesson/books").then(
    (r) => r.books ?? []
  );
}

export function getLearnerBook(bookCode: string): Promise<LearnerBookDetail> {
  return legacyApiFetch<LearnerBookDetail>(
    `/api/lesson/book/${encodeURIComponent(bookCode)}`
  );
}
