import type { Book, BookFormData } from "@/lib/types/types";
import { apiFetch } from "./client";

export function listBooks(): Promise<Book[]> {
  return apiFetch<Book[]>("/api/admin/book");
}

export function getBook(bookCode: string): Promise<Book> {
  return apiFetch<Book>(`/api/admin/book/${bookCode}`);
}

export function createBook(data: BookFormData): Promise<Book> {
  return apiFetch<Book>("/api/admin/book", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateBook(
  bookCode: string,
  data: Partial<BookFormData>
): Promise<Book> {
  return apiFetch<Book>(`/api/admin/book/${bookCode}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteBook(bookCode: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/admin/book/${bookCode}`, {
    method: "DELETE",
  });
}
