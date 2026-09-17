import type { PaginatedResponse } from "@/lib/types/common";
import type { Question, QuestionFormData } from "@/lib/types/question";
import { API_CONSTANTS } from "./constants";
import { apiFetch } from "./client";

export interface QuestionFilters {
  category?: string;
  level?: string;
  lesson?: string;
  skill?: string;
  search?: string;
}

export function listQuestions(
  page = 1,
  pageSize = API_CONSTANTS.DEFAULT_PAGE_SIZE,
  filters: QuestionFilters = {}
): Promise<PaginatedResponse<Question>> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  return apiFetch<PaginatedResponse<Question>>(`/api/admin/question?${params}`);
}

export function getQuestion(id: number): Promise<Question> {
  return apiFetch<Question>(`/api/admin/question/${id}`);
}

export function createQuestion(data: QuestionFormData): Promise<Question> {
  return apiFetch<Question>("/api/admin/question", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateQuestion(
  id: number,
  data: Partial<QuestionFormData>
): Promise<Question> {
  return apiFetch<Question>(`/api/admin/question/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteQuestion(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/admin/question/${id}`, {
    method: "DELETE",
  });
}
