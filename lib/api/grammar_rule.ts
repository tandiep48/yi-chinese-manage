import type {
  GrammarRule,
  GrammarRuleFormData,
  PaginatedResponse,
} from "@/lib/types/types";
import { API_CONSTANTS } from "./constants";
import { apiFetch } from "./client";

export function listGrammarRules(
  page = 1,
  pageSize = API_CONSTANTS.DEFAULT_PAGE_SIZE,
  grammarId?: string,
  type?: number
): Promise<PaginatedResponse<GrammarRule>> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    ...(grammarId ? { grammar_id: grammarId } : {}),
    ...(type !== undefined ? { type: String(type) } : {}),
  });
  return apiFetch<PaginatedResponse<GrammarRule>>(`/api/admin/grammar_rule?${params}`);
}

export function getGrammarRule(id: number): Promise<GrammarRule> {
  return apiFetch<GrammarRule>(`/api/admin/grammar_rule/${id}`);
}

export function createGrammarRule(data: GrammarRuleFormData): Promise<GrammarRule> {
  return apiFetch<GrammarRule>("/api/admin/grammar_rule", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateGrammarRule(
  id: number,
  data: Partial<GrammarRuleFormData>
): Promise<GrammarRule> {
  return apiFetch<GrammarRule>(`/api/admin/grammar_rule/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteGrammarRule(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/admin/grammar_rule/${id}`, {
    method: "DELETE",
  });
}
