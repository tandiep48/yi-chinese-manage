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
