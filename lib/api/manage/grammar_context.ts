import type { PaginatedResponse } from "@/lib/types/common";
import type { GrammarContext, GrammarContextFormData } from "@/lib/types/grammar";
import { API_CONSTANTS } from "../constants";
import { apiFetch } from "../client";
import { grammarContextQuerySchema } from "../schemas/grammar_context";

export function listGrammarContexts(
  page = 1,
  pageSize = API_CONSTANTS.DEFAULT_PAGE_SIZE,
  grammarId?: string
): Promise<PaginatedResponse<GrammarContext>> {
  const body = grammarContextQuerySchema.parse({
    page,
    page_size: pageSize,
    ...(grammarId ? { grammar_id: grammarId } : {}),
  });
  return apiFetch<PaginatedResponse<GrammarContext>>("/api/admin/grammar_context/query", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getGrammarContext(id: number): Promise<GrammarContext> {
  return apiFetch<GrammarContext>(`/api/admin/grammar_context/${id}`);
}

export function createGrammarContext(data: GrammarContextFormData): Promise<GrammarContext> {
  return apiFetch<GrammarContext>("/api/admin/grammar_context", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateGrammarContext(
  id: number,
  data: Partial<GrammarContextFormData>
): Promise<GrammarContext> {
  return apiFetch<GrammarContext>(`/api/admin/grammar_context/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteGrammarContext(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/admin/grammar_context/${id}`, {
    method: "DELETE",
  });
}
