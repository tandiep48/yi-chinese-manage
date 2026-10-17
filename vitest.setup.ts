import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";
import { clearReadCache } from "@/lib/api/readCache";

// lib/api/readCache holds its entries at module scope, so without this a cached
// read from one test silently satisfies the next one's mount and its mock is
// never called. Clearing it globally keeps that failure mode out of every test
// that happens to render a panel.
beforeEach(() => {
  clearReadCache();

  // Pin the UI language so component tests assert against an explicit locale
  // rather than the app's default (now Vietnamese). I18nProvider resolves this
  // saved preference on mount; a test that exercises the VI path switches
  // language itself. Guarded for node-environment tests that have no window.
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem("ui_language", "en");
    } catch {
      // jsdom localStorage is always present; ignore if a test stubbed it out.
    }
  }
});
