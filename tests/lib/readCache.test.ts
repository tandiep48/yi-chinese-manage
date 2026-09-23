// tests/lib/readCache.test.ts
// The TTL cache behind the learner home's mount reads. Reported from use: flipping
// between the three tabs re-issued every panel's fetch, and one of them
// (GET /api/vocab/review) is the ~1.6s full-table endpoint from §4.
//
// The two properties that matter are "a second mount inside the TTL costs
// nothing" and "a failure is never cached" — a sticky error would survive every
// remount and look like a dead tab.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cachedRead, invalidateRead, clearReadCache, CACHE_TTL_MS } from "@/lib/api/readCache";
import * as clock from "@/lib/clock";

beforeEach(() => {
  clearReadCache();
  vi.restoreAllMocks();
});

afterEach(() => vi.restoreAllMocks());

describe("cachedRead", () => {
  it("runs the loader once for repeated reads inside the TTL", async () => {
    const load = vi.fn().mockResolvedValue("rows");

    expect(await cachedRead("k", load)).toBe("rows");
    expect(await cachedRead("k", load)).toBe("rows");
    expect(await cachedRead("k", load)).toBe("rows");

    expect(load).toHaveBeenCalledTimes(1);
  });

  it("joins an in-flight request rather than starting a second", async () => {
    let resolve!: (v: string) => void;
    const load = vi.fn(() => new Promise<string>((r) => (resolve = r)));

    const a = cachedRead("k", load);
    const b = cachedRead("k", load);
    resolve("rows");

    expect(await a).toBe("rows");
    expect(await b).toBe("rows");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("reloads once the TTL has passed", async () => {
    const load = vi.fn().mockResolvedValue("rows");
    const start = 1_000_000;
    const nowSpy = vi.spyOn(clock, "now").mockReturnValue(start);

    await cachedRead("k", load);
    nowSpy.mockReturnValue(start + CACHE_TTL_MS + 1);
    await cachedRead("k", load);

    expect(load).toHaveBeenCalledTimes(2);
  });

  it("keeps separate keys apart", async () => {
    const a = vi.fn().mockResolvedValue("a");
    const b = vi.fn().mockResolvedValue("b");

    expect(await cachedRead("a", a)).toBe("a");
    expect(await cachedRead("b", b)).toBe("b");
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("never caches a failure", async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValue("rows");

    await expect(cachedRead("k", load)).rejects.toThrow("boom");
    // The next mount must retry, not replay the error forever.
    expect(await cachedRead("k", load)).toBe("rows");
    expect(load).toHaveBeenCalledTimes(2);
  });
});

describe("invalidateRead", () => {
  it("drops one key and leaves the others", async () => {
    const a = vi.fn().mockResolvedValue("a");
    const b = vi.fn().mockResolvedValue("b");
    await cachedRead("a", a);
    await cachedRead("b", b);

    invalidateRead("a");
    await cachedRead("a", a);
    await cachedRead("b", b);

    expect(a).toHaveBeenCalledTimes(2);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("drops a whole prefix when the key ends in a colon", async () => {
    const one = vi.fn().mockResolvedValue(1);
    const two = vi.fn().mockResolvedValue(2);
    const other = vi.fn().mockResolvedValue(3);
    await cachedRead("vocab:a", one);
    await cachedRead("vocab:b", two);
    await cachedRead("lesson:a", other);

    invalidateRead("vocab:");
    await cachedRead("vocab:a", one);
    await cachedRead("vocab:b", two);
    await cachedRead("lesson:a", other);

    expect(one).toHaveBeenCalledTimes(2);
    expect(two).toHaveBeenCalledTimes(2);
    expect(other).toHaveBeenCalledTimes(1);
  });
});
