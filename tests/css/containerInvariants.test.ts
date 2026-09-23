// @vitest-environment node
// tests/css/containerInvariants.test.ts
// Guards the one rule that lets a container mount other components' roots inside
// it — the learner home with three panels, the milestone with six steps — when
// their stylesheets share 30 leaf class names (docs/plans/dashboard-tabs.md §2):
//
//   a container stylesheet may only contain selectors whose rightmost simple
//   selector is a class that container owns (`.learner-home…`, `.milestone…`).
//
// Break it — add `.learner-home .btn`, say — and `.learner-home .btn` ties with
// `.trainer-shell .btn` and `.vocab-review .btn` at specificity (0,2,0), leaving
// the winner to stylesheet source order, which Next does not guarantee across
// lazily-loaded chunks. The resulting bug is intermittent and load-order
// dependent, so it is worth failing a test instead of a code review.

import { readFileSync } from "node:fs";
import path from "node:path";
import postcss, { type Rule } from "postcss";
import { describe, expect, it } from "vitest";

// Every stylesheet that wraps other components' roots, and the class prefix each
// one owns. Add a row here when a new container is introduced.
const CONTAINERS = [
  {
    name: "home-shell.css",
    path: "../../components/page/learner/home/home-shell.css",
    owned: /^learner-home[\w-]*$/,
  },
  {
    name: "milestone.css",
    path: "../../components/page/learner/milestone/milestone.css",
    owned: /^milestone[\w-]*$/,
  },
];

// The rightmost compound of a selector, i.e. what the rule actually styles:
// ".a > .b .c:hover::after" -> ".c:hover::after".
function rightmostCompound(selector: string): string {
  const parts = selector.trim().split(/\s*[>+~]\s*|\s+/);
  return parts[parts.length - 1] ?? "";
}

// The class names in a compound, ignoring pseudo-classes/elements and attributes:
// ".learner-home-tab.is-selected:hover" -> ["learner-home-tab", "is-selected"].
function classesOf(compound: string): string[] {
  return Array.from(compound.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g), (m) => m[1]);
}

// At least one owned class in the rightmost compound is enough: a state class like
// `.is-selected` only ever matches alongside `.learner-home-tab`, so it can't reach
// panel markup. A compound with NO class at all (a bare `p`, `h2`, `*`) reaches into
// panel markup just as easily as `.btn` does.
function violatesFor(owned: RegExp) {
  return (selector: string) => !classesOf(rightmostCompound(selector)).some((c) => owned.test(c));
}

const violates = violatesFor(CONTAINERS[0].owned);

function selectorsOf(css: string): { rule: Rule; selector: string }[] {
  const out: { rule: Rule; selector: string }[] = [];
  postcss.parse(css).walkRules((rule) => {
    // @keyframes children are `from` / `to` / `50%`, not document selectors.
    if (rule.parent?.type === "atrule" && /keyframes$/i.test((rule.parent as { name: string }).name)) {
      return;
    }
    rule.selectors.forEach((selector) => out.push({ rule, selector }));
  });
  return out;
}

describe.each(CONTAINERS)("$name owns only its own chrome", ({ path: rel, owned }) => {
  const css = readFileSync(path.resolve(__dirname, rel), "utf8");
  const offends = violatesFor(owned);

  it("has selectors to check", () => {
    expect(selectorsOf(css).length).toBeGreaterThan(10);
  });

  it("never styles a class it does not own", () => {
    const offenders = selectorsOf(css)
      .map(({ selector }) => selector)
      .filter(offends);

    expect(offenders).toEqual([]);
  });
});

describe("the invariant check itself", () => {
  it("rejects the exact selectors the invariant exists to prevent", () => {
    const bad = `
      .learner-home .btn { color: red; }
      .learner-home-panel .rec-card { color: red; }
      .learner-home p { color: red; }
    `;
    const offenders = selectorsOf(bad).map(({ selector }) => selector).filter(violates);
    expect(offenders).toEqual([
      ".learner-home .btn",
      ".learner-home-panel .rec-card",
      ".learner-home p",
    ]);
  });

  it("allows the shapes the chrome legitimately needs", () => {
    const good = `
      .learner-home { display: grid; }
      .learner-home-tab.is-selected { background: #576856; }
      .learner-home-tab.is-selected .learner-home-tab-count { color: #fff; }
      .learner-home-tabs::-webkit-scrollbar { display: none; }
      .learner-home-tab:focus-visible { outline: 0; }
      @media (min-width: 768px) { .learner-home { gap: 24px; } }
      @keyframes learnerHomeShimmer { from { opacity: 0; } to { opacity: 1; } }
    `;
    const offenders = selectorsOf(good).map(({ selector }) => selector).filter(violates);
    expect(offenders).toEqual([]);
  });
});
