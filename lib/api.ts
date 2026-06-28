// lib/api.ts
// Typed async wrappers for all Flask CRUD API endpoints.
// Base URL is read from NEXT_PUBLIC_API_URL in .env.local

import type {
  Vocab,
  VocabFormData,
  LessonPassage,
  PassageFormData,
  PaginatedResponse,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

// ─── Generic fetch helper ───────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// ─── Vocabulary ─────────────────────────────────────────────────────────────

export function listVocab(
  page = 1,
  pageSize = 20,
  hskLevel?: string
): Promise<PaginatedResponse<Vocab>> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    ...(hskLevel ? { hsk_level: hskLevel } : {}),
  });
  return apiFetch<PaginatedResponse<Vocab>>(`/api/admin/vocab?${params}`);
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

// ─── Passages ───────────────────────────────────────────────────────────────

export function listPassages(
  page = 1,
  pageSize = 20,
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
