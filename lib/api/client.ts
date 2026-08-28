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

// Thrown by legacyApiFetch when Flask-Login's @login_required redirects an
// unauthenticated request to the HTML login page instead of returning JSON.
export class UnauthenticatedError extends Error {
  constructor() {
    super("Not authenticated.");
    this.name = "UnauthenticatedError";
  }
}

// Some older endpoints (still shared with the Jinja dashboard, see
// Learning/web_app/static/dashboard/dashboard.js) predate the { success, data }
// envelope and just return the raw JSON body. Use this instead of apiFetch for
// those — do not change their response shape, the legacy page still reads it.
export async function legacyApiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new UnauthenticatedError();
  }

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error || `API error ${res.status}`);
  }

  return body as T;
}
