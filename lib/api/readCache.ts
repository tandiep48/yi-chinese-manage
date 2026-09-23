// lib/api/readCache.ts
// A small TTL cache for the reads a panel re-issues every time it mounts.
//
// The learner home unmounts an inactive tab's panel (docs/plans/dashboard-tabs.md
// Phase 1), which is what keeps a trainer's answers flushed and the mid-session
// guard meaningful. The cost is that flipping between tabs re-runs every mount
// fetch — and one of them, GET /api/vocab/review, is the endpoint §4 measured at
// ~1.6s because it loads all 50k vocabulary rows uncached on the server. Caching
// the *result* keeps the mount policy intact and makes the trip back free.
//
// Deliberately not a general data layer: no revalidation, no subscriptions, no
// request dedupe beyond an in-flight promise. Callers that write something the
// cache would hide invalidate the key themselves.

import { now } from "@/lib/clock";

interface Entry {
  at: number;
  // The promise, not the value: a second caller arriving while the first request
  // is still open should join it rather than start another.
  value: Promise<unknown>;
}

const store = new Map<string, Entry>();

export const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Run `load` and remember the result under `key` for `ttlMs`.
 *
 * A rejected load is evicted immediately, so a failure is retried on the next
 * mount rather than cached as a permanent error.
 */
export function cachedRead<T>(key: string, load: () => Promise<T>, ttlMs = CACHE_TTL_MS): Promise<T> {
  const hit = store.get(key);
  if (hit && now() - hit.at < ttlMs) return hit.value as Promise<T>;

  const value = load().catch((err) => {
    store.delete(key);
    throw err;
  });
  store.set(key, { at: now(), value });
  return value;
}

/** Drop one key, or every key starting with `prefix` when it ends in ":". */
export function invalidateRead(prefix: string): void {
  if (!prefix.endsWith(":")) {
    store.delete(prefix);
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/** Test seam — not used by the app. */
export function clearReadCache(): void {
  store.clear();
}
