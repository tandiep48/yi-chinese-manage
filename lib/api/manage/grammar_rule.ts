import type { PaginatedResponse } from "@/lib/types/common";
import type { GrammarRule, GrammarRuleFormData } from "@/lib/types/grammar";
import { API_CONSTANTS } from "../constants";
import { apiFetch } from "../client";
import { grammarRuleQuerySchema } from "../schemas/grammar_rule";

export function listGrammarRules(
  page = 1,
  pageSize = API_CONSTANTS.DEFAULT_PAGE_SIZE,
  grammarId?: string,
  type?: number
): Promise<PaginatedResponse<GrammarRule>> {
  const body = grammarRuleQuerySchema.parse({
    page,
    page_size: pageSize,
    ...(grammarId ? { grammar_id: grammarId } : {}),
    ...(type !== undefined ? { type } : {}),
  });
  return apiFetch<PaginatedResponse<GrammarRule>>("/api/admin/grammar_rule/query", {
    method: "POST",
    body: JSON.stringify(body),
  });
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
