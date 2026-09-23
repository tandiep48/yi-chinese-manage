import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";
import { clearReadCache } from "@/lib/api/readCache";

// lib/api/readCache holds its entries at module scope, so without this a cached
// read from one test silently satisfies the next one's mount and its mock is
// never called. Clearing it globally keeps that failure mode out of every test
// that happens to render a panel.
beforeEach(() => {
  clearReadCache();
});
