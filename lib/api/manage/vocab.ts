import type { PaginatedResponse } from "@/lib/types/common";
import type { Vocab, VocabFormData } from "@/lib/types/vocab";
import { API_CONSTANTS } from "../constants";
import { apiFetch } from "../client";
import { vocabQuerySchema } from "../schemas/vocab";

export function listVocab(
  page = 1,
  pageSize = API_CONSTANTS.DEFAULT_PAGE_SIZE,
  hskLevel?: string,
  search?: string
): Promise<PaginatedResponse<Vocab>> {
  // The filter now travels in a validated JSON body, not the query string.
  // Parsing here catches a bad page/size/level in the browser and produces the
  // exact shape the backend's VocabQuery model expects.
  const body = vocabQuerySchema.parse({
    page,
    page_size: pageSize,
    ...(hskLevel ? { hsk_level: hskLevel } : {}),
    ...(search && search.trim() ? { search } : {}),
  });
  return apiFetch<PaginatedResponse<Vocab>>("/api/admin/vocab/query", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getVocab(id: number): Promise<Vocab> {
  return apiFetch<Vocab>(`/api/admin/vocab/${id}`);
}

export function createVocab(data: VocabFormData): Promise<Vocab> {
  return apiFetch<Vocab>("/api/admin/vocab", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateVocab(
  id: number,
  data: Partial<VocabFormData>
): Promise<Vocab> {
  return apiFetch<Vocab>(`/api/admin/vocab/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteVocab(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/admin/vocab/${id}`, {
    method: "DELETE",
  });
}
