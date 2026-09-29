// tests/components/manage/DashboardPage.test.tsx
// The /manage dashboard fetches its counts client-side (listVocab / listPassages)
// and renders them into the stat cards + HSK breakdown. These cover the loaded
// numbers, the per-level counts, and the "Unavailable" fallback when a call fails.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import DashboardPage from "@/app/manage/page";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { listVocab } from "@/lib/api/manage/vocab";
import { listPassages } from "@/lib/api/manage/passage";

vi.mock("@/lib/api/manage/vocab", () => ({ listVocab: vi.fn() }));
vi.mock("@/lib/api/manage/passage", () => ({ listPassages: vi.fn() }));

const mockListVocab = listVocab as unknown as ReturnType<typeof vi.fn>;
const mockListPassages = listPassages as unknown as ReturnType<typeof vi.fn>;

function page(total: number) {
  return { items: [], page: 1, page_size: 1, total, total_pages: 1 };
}

function renderPage() {
  return render(
    <I18nProvider>
      <DashboardPage />
    </I18nProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Manage DashboardPage", () => {
  it("renders the total vocab, total passages and per-level counts", async () => {
    // No level ⇒ overall total (100); with a level ⇒ that level's count (5).
    mockListVocab.mockImplementation((_p?: number, _s?: number, level?: string) =>
      Promise.resolve(page(level ? 5 : 100))
    );
    mockListPassages.mockResolvedValue(page(42));

    const { container } = renderPage();

    await waitFor(() =>
      expect(container.querySelector("#stat-vocab")).toHaveTextContent("100")
    );
    expect(container.querySelector("#stat-passages")).toHaveTextContent("42");
    expect(container.querySelector("#hsk-card-HSK1")).toHaveTextContent("5");
    expect(container.querySelector("#hsk-card-HSK6")).toHaveTextContent("5");
    // Static card, not fetched.
    expect(container.querySelector("#stat-levels")).toHaveTextContent("6");
  });

  it("shows Unavailable when the vocab total fails to load", async () => {
    mockListVocab.mockRejectedValue(new Error("network"));
    mockListPassages.mockResolvedValue(page(42));

    const { container } = renderPage();

    await waitFor(() =>
      expect(container.querySelector("#stat-vocab")).toHaveTextContent(
        "Unavailable"
      )
    );
    // A sibling call still resolving is unaffected.
    expect(container.querySelector("#stat-passages")).toHaveTextContent("42");
    // Failed level lookups fall back to 0, not a crash.
    expect(container.querySelector("#hsk-card-HSK1")).toHaveTextContent("0");
  });
});
