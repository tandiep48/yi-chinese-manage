import { expect, type Page } from "@playwright/test";

export type Overflower = { tag: string; cls: string; right: number; width: number };

/**
 * Navigate and wait for async content to render before measuring. Uses
 * networkidle (capped) so data-driven tables/lists are present; the cap keeps
 * socket-backed pages (e.g. learn-together) from hanging. A short tail lets
 * layout settle after the final fetch paints.
 */
export async function gotoAndSettle(page: Page, route: string) {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load").catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(300);
}

/**
 * Collects elements that overflow the viewport horizontally, EXCLUDING ones that
 * live inside an `overflow-x: auto|scroll` wrapper which itself fits the viewport
 * (an intentional, contained horizontal scroll is acceptable; a clipped or
 * page-widening element is not). Also reports whether the page itself scrolls
 * horizontally.
 */
export async function collectOverflow(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const tol = 1;
    const offenders: { tag: string; cls: string; right: number; width: number }[] = [];
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      // Only rightward overflow matters: it widens the page / clips content.
      // Elements parked off the LEFT edge (e.g. the closed off-canvas drawer,
      // right <= 0) are intentional and ignored.
      if (r.right <= vw + tol) continue;
      // Content must FIT the viewport. A deliberate horizontal-scroll region is
      // opted out by marking the scroll wrapper (or an ancestor) with
      // `data-overflow-ok` — otherwise an overflowing element is a failure even
      // when an `overflow:auto` shell would hide it from page-level scroll.
      let allowed = false;
      let p: Element | null = el;
      while (p && p !== document.body) {
        if (p instanceof HTMLElement && p.dataset.overflowOk !== undefined) {
          allowed = true;
          break;
        }
        p = p.parentElement;
      }
      if (allowed) continue;
      const cls =
        typeof el.className === "string" ? el.className.trim().slice(0, 50) : "";
      offenders.push({
        tag: el.tagName.toLowerCase(),
        cls,
        right: Math.round(r.right),
        width: Math.round(r.width),
      });
    }
    // De-dupe by tag+class, keep the widest.
    const byKey = new Map<string, (typeof offenders)[number]>();
    for (const o of offenders) {
      const k = o.tag + "." + o.cls;
      const prev = byKey.get(k);
      if (!prev || o.right > prev.right) byKey.set(k, o);
    }
    const unique = Array.from(byKey.values()).sort((a, b) => b.right - a.right);
    const se = document.scrollingElement ?? document.documentElement;
    return {
      vw,
      pageScrollsX: se.scrollWidth > vw + tol,
      count: offenders.length,
      offenders: unique,
    };
  });
}

/**
 * Asserts the current page does not overflow the viewport horizontally.
 * Produces a readable failure listing the worst offenders.
 */
export async function expectNoHorizontalOverflow(page: Page, label: string) {
  const res = await collectOverflow(page);
  const worst = res.offenders
    .slice(0, 8)
    .map((o) => `  ${o.tag}.${o.cls || "(no class)"} → right ${o.right}px / w ${o.width}px`)
    .join("\n");
  expect(
    res.pageScrollsX,
    `${label} (vw=${res.vw}): page scrolls horizontally`
  ).toBe(false);
  expect(
    res.offenders.length,
    `${label} (vw=${res.vw}): ${res.offenders.length} element(s) overflow the viewport\n${worst}`
  ).toBe(0);
}
