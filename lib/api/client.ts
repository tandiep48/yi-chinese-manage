import { API_CONSTANTS } from "./constants";

const BASE = API_CONSTANTS.BASE_URL;

// Every Flask endpoint responds with the envelope from api-standards.md:
// { success: true, data: ... } or { success: false, error: ... }.
interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    // Send/receive the Flask-Login session cookie across the
    // localhost:3000 -> localhost:5000 origin boundary.
    credentials: "include",
    ...options,
  });

  if (res.status === 204) return undefined as unknown as T;

  let body: ApiEnvelope<T> | undefined;
  try {
    body = await res.json();
  } catch {
    // ignore parse errors (e.g. empty body)
  }

  if (!res.ok || !body?.success) {
    throw new Error(body?.error || `API error ${res.status}`);
  }

  return body.data as T;
}
