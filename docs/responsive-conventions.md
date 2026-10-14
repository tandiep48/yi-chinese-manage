# Learner responsive conventions

The rules Phase 2 follows when making `/learner/*` pages mobile-first, matching
the Flask reference (`docs/flask-reference-css/`). These apply to the **scoped
`.css` files** next to each learner component (not the Tailwind `/manage` side).

## Breakpoints (mobile-first)

Base styles target phones. Layer enhancements upward with `min-width` queries at
the standard widths — never write desktop-first `max-width` rules for new work:

| Alias | `min-width` | Use for |
| --- | --- | --- |
| sm | `480px` | large phones / small-phone landscape |
| md | `768px` | tablets — side-by-side panels, multi-column grids |
| lg | `1024px` | small laptops |
| xl | `1280px` | wide desktop |

```css
/* base = phone */
.lesson-grid { display: grid; grid-template-columns: 1fr; gap: var(--space-4); }
@media (min-width: 768px) {
  .lesson-grid { grid-template-columns: repeat(2, 1fr); }
}
```

These values are mirrored as a comment in `app/styles/tokens.css` (CSS `@media`
can't read custom properties, so the numbers are repeated literally).

## Rules

1. **No horizontal overflow.** Nothing may exceed the viewport width. The
   Playwright guard (`npm run test:e2e`) enforces this at 393 / 768 / 1280px.
2. **Fluid, not fixed, widths.** Don't give in-row elements a hard `min-width`
   that can't fit a 360px screen. Use `min(<px>, 100%)`, `flex`/`flex-wrap`, or
   `grid` with `minmax(0, …)` / `auto-fit` so rows wrap instead of overflowing.
3. **Grids collapse on phones.** Multi-column layouts start at one column and add
   columns at `md`/`lg`.
4. **Tables adapt.** Wide data tables stack into cards (or show fewer columns) on
   phones. A deliberate horizontal-scroll table is allowed only when the scroll
   wrapper is tagged `data-overflow-ok` (and fits the viewport) — see below.
5. **Clear the mobile hamburger.** Page shells need `padding-top:
   var(--hamburger-safe)` below `md` so the first header row isn't hidden under
   the fixed hamburger. Remove the offset at `md` where the rail is in-flow.
6. **Side gutter.** Page content keeps `var(--page-gutter)` of horizontal padding
   on phones so text/controls don't touch the screen edge.
7. **Tap targets ≥ 44px.** Interactive controls meet a 44×44px minimum on touch.
8. **Fluid large type.** Oversized headings / hanzi (`--font-size-3xl`+) scale
   down on phones with `clamp()` or a smaller value at the base size.
9. **Theming unchanged.** Keep using the existing tokens (`--brand-*`,
   `--space-*`, `--font-size-*`); no new hardcoded hex or magic numbers.

## Intentional horizontal scroll (escape hatch)

When a table genuinely must scroll sideways on a phone, wrap it so the **wrapper**
fits the viewport and scrolls internally, and mark the wrapper so the guard
accepts it:

```html
<div class="table-scroll" data-overflow-ok>
  <table class="pinyin-advanced-table">…</table>
</div>
```

```css
.table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
```

Use this sparingly — prefer making content fit (rules 3–4). The guard treats any
element under a `data-overflow-ok` ancestor as acceptable, so don't apply it to
hide a layout that should actually reflow.

## Verifying

```bash
# public routes only
npm run test:e2e
# include authenticated routes (needs the Flask backend on :5000)
E2E_USERNAME=<user> E2E_PASSWORD=<pass> npm run test:e2e
```

See `e2e/README.md` for details.
