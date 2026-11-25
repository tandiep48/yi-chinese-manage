import type { PaginatedResponse } from "@/lib/types/common";
import type {
  LessonLine,
  LessonPassage,
  LineFormData,
  PassageDetailsData,
  PassageFormData,
} from "@/lib/types/lesson";
import type { Vocab } from "@/lib/types/vocab";
import { API_CONSTANTS } from "../constants";
import { apiFetch } from "../client";
import { passageQuerySchema } from "../schemas/passage";

export interface PassageFilters {
  hskLevel?: string;
  bookCode?: string;
  search?: string;
}

export function listPassages(
  page = 1,
  pageSize = API_CONSTANTS.DEFAULT_PAGE_SIZE,
  { hskLevel, bookCode, search }: PassageFilters = {}
): Promise<PaginatedResponse<LessonPassage>> {
  const body = passageQuerySchema.parse({
    page,
    page_size: pageSize,
    hsk_level: hskLevel || undefined,
    book_code: bookCode || undefined,
    q: search || undefined,
  });
  return apiFetch<PaginatedResponse<LessonPassage>>("/api/admin/passage/query", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getPassage(passageId: string): Promise<LessonPassage> {
  return apiFetch<LessonPassage>(`/api/admin/passage/${passageId}`);
}

export function createPassage(data: PassageFormData): Promise<LessonPassage> {
  return apiFetch<LessonPassage>("/api/admin/passage", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updatePassage(
  passageId: string,
  data: PassageDetailsData
): Promise<LessonPassage> {
  return apiFetch<LessonPassage>(`/api/admin/passage/${passageId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ─── Lines ───────────────────────────────────────────────────────────────────

export function addPassageLine(
  passageId: string,
  data: LineFormData & { line_id: number }
): Promise<LessonLine> {
  return apiFetch<LessonLine>(`/api/admin/passage/${passageId}/lines`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updatePassageLine(
  passageId: string,
  lineId: number,
  data: LineFormData
): Promise<LessonLine> {
  return apiFetch<LessonLine>(`/api/admin/passage/${passageId}/lines/${lineId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// `lineIds` is every current line_id in the new order.
export function reorderPassageLines(
  passageId: string,
  lineIds: number[]
): Promise<LessonLine[]> {
  return apiFetch<LessonLine[]>(`/api/admin/passage/${passageId}/lines/order`, {
    method: "PUT",
    body: JSON.stringify({ line_ids: lineIds }),
  });
}

// ─── Passage ↔ Vocabulary links ──────────────────────────────────────────────

export function listPassageVocab(
  passageId: string
): Promise<{ passage_id: string; items: Vocab[]; total: number }> {
  return apiFetch<{ passage_id: string; items: Vocab[]; total: number }>(
    `/api/admin/passage/${passageId}/vocabulary`
  );
}

export function addPassageVocab(
  passageId: string,
  cn: string
): Promise<{ message: string; passage_id: string; cn: string }> {
  return apiFetch(`/api/admin/passage/${passageId}/vocabulary`, {
    method: "POST",
    body: JSON.stringify({ cn }),
  });
}

export function removePassageVocab(
  passageId: string,
  cn: string
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    `/api/admin/passage/${passageId}/vocabulary/${encodeURIComponent(cn)}`,
    { method: "DELETE" }
  );
}
