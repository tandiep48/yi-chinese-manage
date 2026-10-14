# Learner responsive audit (Phase 0 baseline)

Mobile-first responsive work for `/learner/*`, matching the Flask reference
(`docs/flask-reference-css/`). Baseline captured at **iPhone 16 width (393×852)**
in the built-in browser against the running `next dev` server (frontend
`localhost:3000`, Flask backend `localhost:5000`), signed in as test learner
`user1` (has real review/lesson data).

- `overflow` = the count of elements whose right edge exceeds the 393px viewport
  (content clipped or forced into an inner horizontal scroll on a phone).
  Document-level scroll is usually suppressed, so a page with `docScroll=false`
  can still have many clipped elements — the element count is the real signal.
- 393px captured now; **768 / 1280 and the session-gated screens to be captured
  per page during Phase 2** (they need live lesson/practice/exam flows).

## Systemic issues (fix once, helps many pages)

1. **Fixed hamburger overlaps page content.** The mobile floating hamburger
   (`fixed left-3 top-3`, `LearnerSidebar.tsx`) sits on top of each page's first
   line — "Sign in…", "Back to Select Lesson", and the dashboard tabs are all
   clipped under it. Learner page shells need a top offset on mobile (`< md`) to
   clear it, or the hamburger needs its own reserved strip.
2. **Shared `.vocab-table` overflows badly.** 820–860px wide at 393px viewport
   (~2× overflow, 200+ clipped elements). Used by the dashboard review panel and
   `/learner/vocab-review` (and the vocab batch trainer). One responsive fix to
   this shared table clears multiple pages — card/stack layout on mobile, or a
   deliberate scroll container with sticky first column.
3. **Pinyin reference tables overflow.** `.pinyin-basic-table` (427px) and
   `.pinyin-advanced-table` (729px) clip on both edges. Need horizontal-scroll
   wrapping or smaller mobile cell sizing.
4. **Possible content-width gap.** On at least one page the content column
   rendered ~313px wide inside the 393px viewport (dead space on the right).
   Verify whether a leftover desktop `max-width`/width is keeping learner content
   from filling small screens; confirm during Phase 2.

## Route status @ 393px

| Route | Auth | Result | Notes |
| --- | --- | --- | --- |
| `/learner/login` | public | ✅ | Clean. |
| `/learner/register` | public | ✅ | Clean. |
| `/learner/grammar` | public | ✅ | Clean (likely empty without data). |
| `/learner/lesson/basic-pinyin` | public | ❌ | `.pinyin-basic-table` 427px; hamburger overlaps header. |
| `/learner/lesson/advanced-pinyin` | public | ❌ | `.pinyin-advanced-table` 729px (489 clipped els). |
| `/learner` (signed-out) | public | ⚠️ | No overflow, but hamburger overlaps the "Sign in" card. |
| `/learner` (dashboard, signed-in) | auth | ❌ | `.vocab-table` 820px (221 clipped els); hamburger overlaps tabs. |
| `/learner/vocab` | auth | ✅ | Clean. |
| `/learner/practice` | auth | ✅ | Clean (select screen). |
| `/learner/exam` | auth | ✅ | Clean (select screen). |
| `/learner/profile` | auth | ✅ | Clean. |
| `/learner/recommend` | auth | ✅ | Clean. |
| `/learner/vocab-review` | auth | ❌ | `.vocab-table` 860px (218 clipped els). |
| `/learner/translation` | auth | ✅ | Clean but empty (needs a passage selected). |
| `/learner/vocab-learning` | auth | ✅ | Clean but near-empty (needs a session). |
| `/learner/learn-together` | auth | ✅ | Clean (lobby screen only). |
| `/learner/vocab-training-batch` | auth | ↪ | Redirects to `/learner/vocab` without an active batch. |
| `/learner/lesson-learning` | auth | ↪ | Empty state without an active session. |

## Session-gated — audit during Phase 2 (need live flows)

These render only inside an active flow (valid passage / started session), so
they were not captured in the baseline. They hold the richest layouts (side-by-side
panels, trainers, keyboards, cards) and are the highest risk on mobile:

- Lesson study view (`/learner/lesson` with a passage — currently "Failed to load passage" without one)
- Lesson trainer (`lesson-training`) — choice / typing / reorder tasks + recap
- Practice runner (`/learner/practice/[number]`, `/multi`) with audio scrubber
- Exam runner (`/learner/exam/[number]`, `/[number]/[lesson]`)
- Vocab learning flashcards + vocab batch trainer (populated)
- Competition active screens (setup / waiting / ranking)
- Translation panel with a passage loaded

## Legend

✅ no overflow · ❌ overflows (fix needed) · ⚠️ overlaps/minor · ↪ redirect/empty-state

---

## Automated guard (Phase 1)

A Playwright overflow guard now enforces "no horizontal overflow" at **393 /
768 / 1280px** across the audited routes — see `e2e/README.md` and
`docs/responsive-conventions.md`. Run:

```bash
E2E_USERNAME=<learner> E2E_PASSWORD=<pass> npm run test:e2e
```

### Baseline result (failing = needs Phase 2 fix)

| Route | 393 | 768 | 1280 |
| --- | --- | --- | --- |
| `/learner` (dashboard) | ❌ | ❌ | ✅ |
| `/learner/vocab-review` | ❌ | ❌ | ✅ |
| `/learner/lesson/basic-pinyin` | ❌ | ❌ | ✅ |
| `/learner/lesson/advanced-pinyin` | ❌ | ❌ | ❌ |
| `/learner/vocab` | ✅ | ❌ | ✅ |
| all other audited routes | ✅ | ✅ | ✅ |

Notes surfaced by the guard beyond the 393px audit:
- Overflow mostly clears by 1280px (the tables fit), but `advanced-pinyin`
  overflows even at desktop — investigate in Phase 2.
- `/learner/vocab` overflows **only at 768px** — a missing mid-range breakpoint,
  not visible at phone or desktop width.
- The dashboard's `.learner-home-tab` row also overflows (not just `.vocab-table`).

### Phase 2 progress — all guarded routes now green ✅

`npm run test:e2e` passes on every audited route at 393/768/1280. Fixes:

| Fix | Pages cleared | Commit |
| --- | --- | --- |
| Hamburger clearance (shell `--hamburger-safe`) | every learner page | `93fc833` |
| Shared `.vocab-table` scroll wrapper (unscoped + `data-overflow-ok`) | dashboard, vocab-review, batch trainer | `d42d2f9` |
| Pinyin guide tables (scroll-clip fix + marker) | basic/advanced pinyin | `bdfc2e5` |
| Home tab bar marker | dashboard | `56a6658` |
| Vocab filter bar `auto-fit` wrap | /vocab at tablet | `39a1663` |

Disproven: the Phase 0 "content-width gap" (#4) was a browser-pane capture
artifact — `html`/`body`/`.learner-theme`/`.learner-main` all fill the full 393px.

### Session-gated screens (manual, not guard-covered)

Checked at 393/768/1280 by driving a live lesson as the test learner.

**Done:**
- Lesson study view + sidebar — fixed a severe bug: the study layout collapsed
  its main column to 0px on mobile (cross-file flex-direction load-order). Now
  stacks mobile-first, rail at 1280. (`a784361`)
- Lesson trainer — choice / typing / reorder tasks + recap all lay out cleanly
  (no changes needed; reorder chips flex-wrap, recap table has a scroll wrapper).
- Practice runner & exam runner — verified at 393/768, no changes needed. Shared
  practice-shell; question navigator grid wraps, audio scrubber fits (its
  min-width:180 does not overflow), listening and reading/matching question
  types both lay out cleanly.
- Vocab learning flashcards (lesson "Vocab Learner" step) & vocab batch trainer —
  verified at 393, no changes needed (trainer shares trainer-shell; flashcard
  card + input stack cleanly).
- Competition — setup/lobby verified clean; waiting/ranking reviewed (ranking
  rows stack at 640, play grid at 900). Hardened the setup/lobby auto-fit grid
  with minmax(min(100%,300px),1fr) so it can't overflow phones under ~340px.
- Translation with a passage — verified at 393; uses the lesson-study layout, so
  it inherits the sidebar-stacking fix.

**Phase 2 complete:** every learner surface audited is responsive at
393/768/1280 (or scrolls intentionally where the Flask design did). The
Playwright guard (`npm run test:e2e`) stays green; session-gated screens were
checked manually by driving live flows as the test learner.
