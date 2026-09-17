import type { PaginatedResponse } from "@/lib/types/common";
import type { LessonPassage, PassageFormData } from "@/lib/types/lesson";
import type { Vocab } from "@/lib/types/vocab";
import { API_CONSTANTS } from "./constants";
import { apiFetch } from "./client";

export function listPassages(
  page = 1,
  pageSize = API_CONSTANTS.DEFAULT_PAGE_SIZE,
  hskLevel?: string
): Promise<PaginatedResponse<LessonPassage>> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    ...(hskLevel ? { hsk_level: hskLevel } : {}),
  });
  return apiFetch<PaginatedResponse<LessonPassage>>(
    `/api/admin/passage?${params}`
  );
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
  data: Partial<PassageFormData>
): Promise<LessonPassage> {
  return apiFetch<LessonPassage>(`/api/admin/passage/${passageId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deletePassage(
  passageId: string
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/admin/passage/${passageId}`, {
    method: "DELETE",
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
