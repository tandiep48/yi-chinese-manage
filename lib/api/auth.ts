import type { AuthUser } from "@/lib/types/types";
import { apiFetch } from "./client";

export function login(username: string, password: string): Promise<AuthUser> {
  return apiFetch<AuthUser>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function register(
  username: string,
  email: string,
  password: string
): Promise<AuthUser> {
  return apiFetch<AuthUser>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}

export function logout(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/api/auth/logout", {
    method: "POST",
  });
}

export function fetchCurrentUser(): Promise<AuthUser> {
  return apiFetch<AuthUser>("/api/auth/me");
}
