import type { PaginatedResponse } from "@/lib/types/common";
import type { User, UserFormData } from "@/lib/types/user";
import { API_CONSTANTS } from "./constants";
import { apiFetch } from "./client";

export function listUsers(
  page = 1,
  pageSize = API_CONSTANTS.DEFAULT_PAGE_SIZE,
  search?: string
): Promise<PaginatedResponse<User>> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    ...(search ? { search } : {}),
  });
  return apiFetch<PaginatedResponse<User>>(`/api/admin/user?${params}`);
}

export function getUser(id: number): Promise<User> {
  return apiFetch<User>(`/api/admin/user/${id}`);
}

export function createUser(data: UserFormData): Promise<User> {
  return apiFetch<User>("/api/admin/user", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateUser(
  id: number,
  data: Partial<UserFormData>
): Promise<User> {
  return apiFetch<User>(`/api/admin/user/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteUser(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/admin/user/${id}`, {
    method: "DELETE",
  });
}
