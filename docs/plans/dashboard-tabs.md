# Learner dashboard → tabbed learning container

Replace the learner dashboard (`/learner`) with a single container holding three
tabs — **Word Review**, **Lesson**, **Recommend** — where each tab runs its
activity in place instead of navigating away.

Branch: `dev`. Not committed on completion (CLAUDE.md 3.4).
Written 2026-09-19.

---

## 1. Locked decisions

These were chosen explicitly. Do not re-litigate them.

| Decision | Choice |
|---|---|
| CSS scoping | **Don't nest the roots.** The container styles only its own chrome; each tab panel keeps its existing root class and stylesheet, as a non-descendant. |
| Lesson tab scope | **Full inline** — lesson learner *and* vocab/lesson trainers run in the panel. |
| Trainer presentation | **Contained in the panel** — tab bar stays visible, bottom bar becomes sticky-within-panel. |
| Statistics | **Move to `/learner/profile`.** Not a tab, not kept on the dashboard. |
| URL state | **Query params** — `?tab=…&run=…`. Refresh and Back survive. |
| Existing routes | **Keep `/learner/vocab-review` and `/learner/recommend`, keep them in TopNav.** Tabs are an additional entry point. |
| Rollout | **Build alongside** at `/learner/home-v2`, swap `app/learner/page.tsx` at the end. |
| Progress indicators | Within-current-lesson progress + words-due-in-review count. "Next lesson" is a plain label, no gating. |
| Lesson flow | A six-step **milestone** per part — see §10. |
| Plan location | `docs/plans/` (new folder). |

---

## 2. The CSS problem, and the invariant that solves it

### Evidence

A scan of the stylesheets that will coexist in the container found **30 leaf
class names defined in two or more of them**. The worst cluster:
`dashboard-rec-card.css` and `recommend-card.css` share **18** names
(`.rec-card`, `.hsk-badge`, `.status-badge`, `.category-badge`, `.rec-card-meta`,
`.rec-card-header`, `.selected`, `.hsk-1`…`.hsk-6`, …) with *deliberately
different designs* — `recommend-card.css:7` documents the split. Generic names
are worse still: `.btn` is defined in four files, `.primary`/`.secondary` in
three, `.active` in two.

Today this is safe because every rule is prefixed with a single root class:
`.ui2-dashboard .rec-card` vs `.recommend-page .rec-card`. Both are specificity
**(0,2,0)**. They never meet, because the two roots are never ancestors of the
same element.

**Nesting breaks that.** Put the recommend panel inside `.ui2-dashboard` and both
selectors match — the winner is decided by stylesheet source order, which Next
does not guarantee across lazily-loaded chunks. The same tie appears for
`.ui2-dashboard .btn` vs `.trainer-shell .btn` vs `.vocab-review .btn`.

### The invariant

> **`home-shell.css` may only contain selectors whose rightmost simple selector
> is a class it owns (`.learner-home…`). It must never contain a descendant
> selector ending in a class owned by another stylesheet.**
>
> In other words: no `.learner-home .btn`, no `.learner-home .card`, no
> `.learner-home .tag`. The container does layout for its own chrome and
> nothing else. Panels keep their own roots and their own stylesheets,
> byte-for-byte untouched.

DOM shape that enforces it:

```
<div class="learner-home">              ← layout only; owns no descendant rules
  <nav class="learner-home-tabs"> … </nav>
  <div class="learner-home-panel">      ← layout only (sizing, position: relative)
    <div class="vocab-review"> … </div>   ← panel's own root, untouched
  </div>
</div>
```

`.learner-home` is a **new** root. Do **not** reuse `.ui2-dashboard` — it already
carries `.ui2-dashboard .btn`, `.ui2-dashboard .tag`, `.ui2-dashboard .rec-card`
and would reintroduce every tie the invariant exists to prevent.

### Guard

Add an automated test (§7) that parses `home-shell.css` and fails if any selector
violates the invariant. Cheap, and it makes the rule survive future edits.

### Verification technique

When dismantling `dashboard.css` / `dashboard-rec-card.css` / `dashboard-stats.css`
in Phase 5–6, prove no rule was lost with the postcss walk from the
2026-09-17 refactor: flatten each file to `at-rule-context || selector ||
prop:value` rows, expand grouped selectors, diff old vs new. A `sed`-based
comment stripper is **not** sound here.

---

## 3. Phases

Each phase ships independently. Existing routes keep working throughout, because
every hook seam is an *optional* argument — called with no args, behaviour is
byte-identical to today.

### Phase 0 — Make the shared pieces embeddable (no UI change)

The three engines already separate cleanly into *entry resolution* + *engine* +
*exit*. Only the first and third are page-bound.

**`hooks/vocab/useVocabTrainer.ts`**
- Signature → `useVocabTrainer(opts?: { words?: TrainerWord[]; onExit?: () => void })`.
- When `opts.words` is present, skip the entry-resolution effect entirely
  (`useVocabTrainer.ts:115`) — no `sessionStorage` peek, no
  `window.location.search`, no `router.replace("/learner/vocab")` fallbacks.
  Call `start(opts.words)` directly.
- `goHome` (`:235`) calls `opts.onExit` when provided, else the existing
  `router.push`.
- Add **flush on unmount**: `pendingRef` currently only drains on `advance()`
  (`:163`). Unmounting a running trainer silently drops the batch. Required now
  that a tab switch can unmount it.

**`hooks/lesson/useLessonTrainer.ts`**
- Same shape: `{ passageIds?, types?, onExit? }`.
- Its entry effect (`:123`) also has `router.replace` escapes for the pinyin
  placeholders (`H1_1_1`, `H1_1_2`) and `H1_5_99`. In embedded mode these must
  become a rendered message, not a navigation — the container has nowhere to go.
- Same flush-on-unmount.

**`hooks/practice/usePracticeEngine.ts`**
- Already fully props-driven (`PracticeEngineOptions`, `:37`). Only add
  `referrer?: ReferrerInfo` to override the `sessionStorage("practice_referrer")`
  read at `:80`, and `onExit?`.
- Multi mode reads `sessionStorage("multi_practice_queue")`; add an optional
  `items?: PracticeMultiItem[]` to bypass it.

**`components/page/learner/trainer/TrainerShell.tsx`**
- New `contained?: boolean` prop → root becomes `trainer-shell <scope> contained`.
- In `trainer-shell.css` (same file as the base rule, per the cascade convention):

  ```
  .trainer-shell.contained .trainer-bottom-bar {
    position: sticky; bottom: 0; left: auto; width: 100%; z-index: 5;
  }
  .trainer-shell.contained .app-container { padding-bottom: clamp(16px,3vw,32px); }
  ```

  The base rule (`trainer-shell.css:182`) stays `position: fixed` for the
  standalone routes.
- **Verified in-browser 2026-09-19 — this works.** See §8.1 for the measurements.
- The quit modal and `SuccessPopup` are true overlays — leave them alone.

**Exit criteria:** all existing routes behave identically; `tsc` clean; lint no
worse than the 41-problem baseline; new hook tests pass.

### Phase 1 — The shell

New files under `components/page/learner/home/`:

- `HomeShell.tsx` — the container, tab state, lazy panel loading, mid-session guard.
- `HomeTabs.tsx` — the tab bar (`role="tablist"`, arrow-key roving focus, count badges).
- `home-shell.css` — chrome only, subject to the §2 invariant.
- `HomePanelSkeleton.tsx` — the `next/dynamic` loading state (CLAUDE.md 4.5).

New hook `hooks/home/useLearnerHome.ts`:
- Reads/writes `?tab=` and `?run=` via `useSearchParams` + `router.replace`
  (shallow — no navigation). `app/learner/lesson/page.tsx:40` already uses this
  exact pattern with `?view=`.
- Valid tabs: `review | lesson | recommend`. Unknown or absent → `review`.
- Exposes `sessionActive` so a tab switch mid-trainer can be intercepted.

**Lazy loading.** Each panel is a `next/dynamic` import. This is the **first use
of `next/dynamic` in the repo** — there are currently zero dynamic imports
outside the two `hanzi-writer` call sites. Without it the route eagerly ships
~193 KB of TSX source and ~119 KB of CSS (~50–60 KB JS + ~20 KB CSS gzipped).

**Mount policy:** unmount inactive panels. Combined with flush-on-unmount
(Phase 0) and the guard below, in-flight answers are never lost.

**Mid-session guard:** clicking another tab while a trainer is running opens the
existing quit modal. Confirm → flush + switch. Cancel → stay.

Route: `app/learner/home-v2/page.tsx`, thin wrapper rendering `HomeShell`.

### Phase 2 — Word Review tab

Smallest surface; proves the Phase 0 seam end to end.

- `ReviewTab.tsx` reuses `VocabReviewPage`'s list, selection and audio. Extract
  the list into a presentational piece if needed, but do not fork the logic —
  `hooks/vocab/useVocabReview` stays the single source.
- Replace the hand-off at `VocabReviewPage.tsx:61` (write
  `selectedVocabTrainerWords` → `router.push("/vocab-training-batch")`) with, in
  the embedded path, `setRun("vocab-trainer")` + pass `review.selectedWords`
  straight to `useVocabTrainer({ words, onExit })`.
- The standalone `/learner/vocab-review` route keeps the sessionStorage path.
- **Tab badge (words due) shows up front, on dashboard mount**, via
  `getVocabReviewCount()` → `GET /api/vocab/review/count`. That endpoint was
  added to Flask for this (see §4). Do **not** call `getVocabReview` for a
  count.

### Phase 3 — Recommend tab

- `RecommendTab.tsx` reuses `RecommendPage`'s filters, grid and multi-select via
  `hooks/useRecommend`.
- `useRecommend.startSelected` currently stashes `multi_practice_queue` +
  `practice_referrer` then redirects. In embedded mode, pass the items to
  `PracticeRunner` through the new `items` / `referrer` options instead.
- `PracticeRunner` is already props-driven, so this tab is mostly wiring.
- **Delete `components/page/learner/dashboard/dashboard-rec-card.css` and the
  inline card markup in `RecommendedSection.tsx`.** It is a non-interactive
  duplicate of `RecommendCard.tsx` (CLAUDE.md 1.3) and the source of 18 of the 30
  name collisions. The real card is richer (progress range, recent-word focus)
  and already selectable.

### Phase 4 — Lesson tab = the milestone

Biggest, highest risk. Do it last. Fully specified in §10.

The Lesson tab does not get its own sub-view machine — it mounts the shared
`MilestoneRunner` from §10, the same component `/learner/lesson` mounts. The
tab supplies the `passage_id` from `useDashboardHome().lesson`; everything else
is the milestone's own state.

`?run=` from Phase 1 becomes `?step=` (1–6) inside the lesson tab.

### Phase 5 — Statistics → profile

- Move `LearningStatistics.tsx` + `MiniBarChart.tsx` + `dashboard-stats.css` into
  `components/page/learner/profile/`, re-scoped from `.ui2-dashboard` to
  `.profile-page`.
- Move the `getGlobalStats` / `getLearnedWordsLast3Days` / `getTimeLearnedLast3Days`
  calls out of `useDashboardHome` into the profile hook.
- Verify with the postcss walk that no rule was dropped in the re-scope.

### Phase 6 — Swap and clean up

- Point `app/learner/page.tsx` at `HomeShell`; delete `app/learner/home-v2/`.
- Delete `CurrentLessonCard.tsx`, `ReviewCard.tsx`, `RecommendedSection.tsx`,
  `dashboard.css`, and whatever remains of `dashboard-rec-card.css` /
  `dashboard-stats.css` (CLAUDE.md 2.4).
- Trim `useDashboardHome` to what the tabs actually consume, or retire it.
- Re-run the collision scan: the surviving stylesheets should share no leaf name
  across roots that are now DOM-nested.

---

## 4. Request budget

| | Today | Target |
|---|---|---|
| Dashboard mount | 5 | **2** (current lesson + review count) |
| + Review tab | — | 1 (review list) |
| + Lesson tab | — | 3 (parts, picker-progress, passage vocab) |
| + Recommend tab | — | 1 |

Only the active tab fetches. `getPassages` / `getPickerProgress` are level-keyed
and should be shared between the lesson tab and anything else that needs them.

### `/api/vocab/review` is not a cheap count — checked 2026-09-19

Read `Learning/web_app/routes/vocab/vocab_routes.py:509-535`. Two findings, both
of which change the plan:

1. **`page_size=1` is impossible.** Line 515 clamps it:
   `page_size = min(200, max(5, int(...)))`. The smallest page is 5.
2. **Pagination happens last, in Python, after all the work is done.** The
   handler runs, on every call, regardless of `page_size`:
   - `get_review_words_flat(user_id)` → `get_review_words()` → two per-user
     analytic queries (`get_unsure_words_from_db`, `get_unlearned_words_from_db`)
     plus three dedup passes;
   - `get_records_for_words(words)` → `get_full_lesson_records()` →
     `get_course_vocab()` → `VocabRepository.get_all_ordered()`, which is
     `SELECT * FROM vocabulary ORDER BY hsk_level, id` — **every vocabulary row
     in the database**, loaded into a pandas DataFrame with
     **no caching of any kind** (no `lru_cache`, no memoization), then
     `dropna().drop_duplicates().reset_index()`;
   - `normalize_vocab_row` over every matched row (line 527);
   - `paginate_rows` slices the finished Python list (line 528).

   So a "count" costs exactly the same as fetching the entire review list.

**Consequence:** the dashboard must never call this route for a count.

### Resolved — `GET /api/vocab/review/count` added 2026-09-19

Added to Flask on `dev_version_2.0` (uncommitted, per CLAUDE.md 3.4) so the badge
can show before the tab is opened:

- `VocabRepository.get_existing_words(words)` — `SELECT DISTINCT cn FROM
  vocabulary WHERE cn IN (…)`, indexed and bounded by the review-list size.
- `get_existing_vocab_words(words)` in `entity/vocabulary/service.py` — the
  session wrapper.
- `get_review_count()` in `routes/vocab/vocab_routes.py` — the two per-user
  analytic queries (unavoidable for an accurate count), then one indexed
  lookup. No pandas, no full-table load.

**The contract is that it returns exactly what `/review` reports as `total`** —
the review words that exist in the vocabulary table *or* in the static number
rows, deduplicated by word (the same union `get_records_for_words()` builds).
That equivalence is what the tests pin down, including a stub that fails the test
if `get_course_vocab()` is ever called from the count path.

Frontend helper: `getVocabReviewCount()` in `lib/api/learner/vocab.ts`.

**Verified live against the real database** (Flask restarted 2026-09-19; the
server runs `use_reloader=False`, so a code change needs a manual restart):

- Route registered and auth-gated (302, was 404 before the restart).
- Real data, user 1 with 253 review words: `count` = 253, `/review`'s `total` =
  253. Agreement confirmed on real rows, not just fixtures.
- The vocabulary table holds **50,434 rows** — this is why the old path is slow.

Measured component costs:

| | cost | |
|---|---|---|
| `get_review_words_flat()` | ~413 ms | unavoidable per-user analytics |
| `get_existing_vocab_words()` | ~85 ms | the new indexed lookup |
| `get_course_vocab()` | ~1250 ms | the full-table load, **now skipped** |

So the count endpoint runs ~500 ms against ~1660 ms for the list path (measured
warm, the gap was 129 ms vs 1494 ms — 11.6x).

**Caveat worth acting on later:** ~413 ms of the count's ~500 ms is
`get_review_words_flat` — two per-user analytic queries
(`get_unsure_words_from_db`, `get_unlearned_words_from_db`) that this endpoint
cannot avoid. The badge is therefore still ~0.5 s on every dashboard mount. It
runs in parallel with the current-lesson request and blocks nothing else, so it
is acceptable for now, but if the dashboard ever feels slow this is the cost to
attack — either by optimising those two queries or by caching the count per user
with a short TTL. Out of scope here.

---

## 5. Files

**New**
```
docs/plans/dashboard-tabs.md
app/learner/home-v2/page.tsx                        (deleted in Phase 6)
components/page/learner/home/HomeShell.tsx
components/page/learner/home/HomeTabs.tsx
components/page/learner/home/HomePanelSkeleton.tsx
components/page/learner/home/ReviewTab.tsx
components/page/learner/home/LessonTab.tsx
components/page/learner/home/RecommendTab.tsx
components/page/learner/home/home-shell.css
hooks/home/useLearnerHome.ts
components/page/learner/milestone/MilestoneRunner.tsx      §10
components/page/learner/milestone/MilestoneBar.tsx         §10
components/page/learner/milestone/milestone.css            §10
hooks/lesson/useLessonMilestone.ts                         §10
lib/api/learner/milestone.ts                               §10
```

**New in `Learning/` (Flask)** — §10
```
web_app/entity/user_lesson_milestone/{__init__,entity,repository,service}.py
web_app/tests/test_lesson_milestone_routes.py
migration: CREATE TABLE user_lesson_milestone
routes/lesson/lesson_routes.py   GET + POST /api/lesson/milestone
```

**Changed**
```
hooks/vocab/useVocabTrainer.ts          optional args + flush on unmount
hooks/lesson/useLessonTrainer.ts        optional args + flush on unmount
hooks/practice/usePracticeEngine.ts     referrer/items/onExit overrides
hooks/useRecommend.ts                   embedded start path
components/page/learner/trainer/TrainerShell.tsx     contained prop
components/page/learner/trainer/trainer-shell.css    .contained rules
components/page/learner/vocab-learning/FlashcardStudy.tsx   shell opt-out
components/page/learner/vocab-review/VocabReviewPage.tsx    embedded start path
components/page/learner/lesson/WordSummary.tsx        hideActions prop (§10)
components/page/learner/lesson/LessonSummary.tsx      hideActions prop (§10)
app/learner/lesson/page.tsx             branch: book → legacy, HSK → milestone
app/learner/page.tsx                    Phase 6 swap
app/learner/profile/…                   Phase 5 stats
lib/i18n/{en,vi}.json                   home.* keys (tabs, guard modal, next-part label)
```

**Deleted (Phase 6)**
```
components/page/learner/dashboard/CurrentLessonCard.tsx
components/page/learner/dashboard/ReviewCard.tsx
components/page/learner/dashboard/RecommendedSection.tsx
components/page/learner/dashboard/dashboard.css
components/page/learner/dashboard/dashboard-rec-card.css
components/page/learner/dashboard/{LearningStatistics,MiniBarChart}.tsx  → moved
components/page/learner/dashboard/dashboard-stats.css                    → moved
```

No barrel files (locked 2026-09-17). Importers name the specific module.

---

## 6. i18n

New `home.*` namespace in `lib/i18n/{en,vi}.json`: tab labels, the
"session in progress" guard modal, the next-part label, and the per-tab count
badges. Reuse existing `dashboard.*`, `recommend.*`, `vocab_trainer.*`,
`picker.*` keys wherever the copy is unchanged — most of it is.

---

## 7. Tests (CLAUDE.md 2.3)

```
tests/css/homeShellInvariant.test.ts    parses home-shell.css; fails on any
                                        descendant selector ending in a class
                                        the container doesn't own
tests/hooks/home/useLearnerHome.test.ts tab from ?tab=, default, unknown value,
                                        run param round-trip, guard state
tests/hooks/vocab/useVocabTrainer.test.ts   words-as-props path never touches
                                        sessionStorage or the router; onExit
                                        replaces goHome; flush on unmount
tests/hooks/lesson/useLessonTrainer.test.ts  same, plus the pinyin-placeholder
                                        cases render a message instead of
                                        navigating
tests/components/home/HomeShell.test.tsx     tab switch mid-session opens the
                                        guard; confirm flushes and switches;
                                        cancel stays
```

Existing coverage to keep green: `tests/hooks/lesson/useLessonParts.test.ts`,
`tests/lib/recommendLogic.test.ts`, `tests/lib/vocabTrainer.test.ts`,
`tests/lib/lessonTrainer.test.ts`.

---

## 8. Risks

1. ~~**Sticky bottom bar**~~ — **RESOLVED, verified in-browser 2026-09-19.**

   Measured against a replica of the planned DOM injected into the live
   `/learner` page:
   - The page body does **not** scroll (`html`/`body` are fixed at viewport
     height, `overflow: visible`). The **only** scroll container is
     `div.flex.flex-1.flex-col.overflow-auto` from `app/learner/layout.tsx:25`.
   - No `overflow: hidden`, no `transform`, and no `contain` anywhere in the
     ancestor chain — the three things that silently break sticky.
   - The bar computed `position: sticky` and pinned exactly to the scroller's
     bottom edge (`barBottom - scrollerBottom = 0`) at every mid-scroll
     position, releasing to its natural place only once the panel's own bottom
     came into view. Correct behaviour, not a failure.
   - **Horizontal containment confirmed — this is the bug the variant fixes.**
     Sticky bar measured `left 15 → right 1003`, tracking its panel
     (`12 → 1006`). `position: fixed` in the same place measured
     `0 → 1024`, i.e. the full viewport.
   - Re-ran at 375px (mobile): identical pinning, contained to the panel, no
     horizontal page scroll.
2. **Lazy chunk CSS order.** The invariant is what makes order irrelevant. If the
   invariant is ever violated, the bug will be intermittent and load-order
   dependent — the worst kind. Hence the automated guard.
3. **Lint baseline is 41 problems (36 errors, 5 warnings).** Pre-existing
   `react-hooks/set-state-in-effect` and friends; `next build` does not fail on
   them. Do not regress the count. Respect `react-hooks/purity` (use
   `lib/clock.ts`'s `now()`) and `react-hooks/refs`.
4. **StrictMode + sessionStorage.** The embedded paths bypass sessionStorage
   entirely, so the peek-don't-consume rule only still applies to the standalone
   routes. Don't "simplify" it away while refactoring.
5. **Mobile (CLAUDE.md 4.3).** The tab bar scrolls horizontally under `sm:`; the
   panel goes full-bleed; the sticky bar must not cover the primary action.
6. **Book parts** have no progress data (Phase 4).

---

## 9. Out of scope

- Further backend changes beyond the two named: `GET /api/vocab/review/count`
  (done, §4) and the milestone table + endpoints (§10).
- Time gating / spaced-repetition scheduling ("come back in 2 days"). Nothing in
  the codebase implements it — no due dates, no cooldowns, no unlock timestamps.
  "Next lesson" is a plain label.
- Removing `/learner/vocab-review` or `/learner/recommend`, or touching TopNav.
- The trainer routes (`/learner/vocab-training-batch`, `/learner/lesson-training`)
  — the lesson page and part picker deep-link into them with `?passage_id=`.
- Flipping the `next.config.ts` learner redirects from 307 to 308 (that is a
  launch task).

---

## 10. The lesson milestone (Duolingo-style)

Clicking a part (e.g. HSK1 · Lesson 2 · Part 1) runs a fixed six-step path.
The learner walks it end to end, then moves on to Part 2.

### 10.1 Locked decisions

| Decision | Choice |
|---|---|
| Storage | **New `user_lesson_milestone` table** |
| Step completion | Passive steps on Continue; graded steps at/above the pass threshold |
| Gating | **Soft** — nothing locks; the milestone guides, the sidebar still jumps |
| Surface | Both `/learner/lesson` and the dashboard Lesson tab, one shared component |
| Book parts | **No milestone** — books keep today's tabbed page |
| Existing learners | Backfill from existing signals |
| Replay | Completed overview; any step replayable |
| Sidebar | Kept |

### 10.2 The six steps

| # | Step | Kind | Completes when |
|---|---|---|---|
| 1 | Vocab summary | passive | Continue clicked |
| 2 | Vocab learner (flashcards) | passive | Continue clicked |
| 3 | Vocab trainer | graded | run finishes at/above pass threshold |
| 4 | Lesson summary | passive | Continue clicked |
| 5 | Lesson learner (line cards) | passive | Continue clicked |
| 6 | Lesson trainer | graded | run finishes at/above pass threshold |

Step 6 already behaves this way: `mark_lesson_part_completed` only stamps
`lesson_trainer_completed_at` at/above the threshold
(`entity/progress/service.py:55`). No behaviour change there.

### 10.3 Data model

New table, following the `user_lesson_part_progress` pattern:

```sql
CREATE TABLE user_lesson_milestone (
  user_id      BIGINT      NOT NULL,
  passage_id   VARCHAR     NOT NULL,
  step         SMALLINT    NOT NULL,   -- 1..6
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, passage_id, step)
);
```

One row per completed step. Writes are `ON CONFLICT DO NOTHING` so a replay
never moves the original timestamp.

New module `web_app/entity/user_lesson_milestone/` — `entity.py`,
`repository.py`, `service.py`, `__init__.py` — mirroring
`entity/user_lesson_part_progress/`.

**Steps 3 and 6 are also derived, never trusted from this table alone.** Their
authoritative sources already exist:

- step 3 → every word of the part is mastered (`get_learned_words` ∩ part vocab)
- step 6 → `user_lesson_part_progress.lesson_trainer_completed_at IS NOT NULL`

Effective completion is `stored OR derived`. This is what makes the milestone
incapable of drifting out of step with mastery data, and it is also the whole
backfill story.

### 10.4 Backfill — derive on read, write forward

**No migration script and no data backfill.** On read, the effective step set is:

1. stored rows for this (user, passage), plus
2. step 3 if the part's words are all mastered, plus
3. step 6 if `lesson_trainer_completed_at` is set, plus
4. **every step below the highest completed one** — finishing the lesson trainer
   implies the learner got there.

So a learner who completed HSK1 L1 P1 before this shipped opens it and sees 6/6,
with no rows in the new table. Rows accrue only as steps are completed from now
on.

### 10.5 API

```
GET  /api/lesson/milestone?passage_id=X
     → { passage_id, total_steps, current_step,
         steps: [ { step, completed, completed_at } ] }

POST /api/lesson/milestone   { passage_id, step }
     → marks one step complete (ON CONFLICT DO NOTHING)
```

`POST` is for the passive steps (1, 2, 4, 5). Step 6 keeps flowing through the
existing `/api/lesson/part-complete` — do not double-write it. Step 3 is
recorded by the vocab trainer's existing batch submit; the milestone only reads
it. `current_step` is the lowest incomplete step, or `total_steps + 1` when the
part is finished.

### 10.6 Frontend

New shared component `components/page/learner/milestone/`:

- `MilestoneRunner.tsx` — owns the step machine, mirrors `?step=` into the URL.
- `MilestoneBar.tsx` — the six-segment indicator plus the step title
  ("Step 3 of 6 · Vocab Trainer").
- `milestone.css` — subject to the §2 no-nesting invariant.
- `hooks/lesson/useLessonMilestone.ts` — fetches, advances, exposes `currentStep`.

Each step reuses an existing component unchanged except for chrome:

| # | Component | Note |
|---|---|---|
| 1 | `WordSummary` | footer actions hidden |
| 2 | `FlashcardStudy` | no `passageId`, or `shell={false}` — else it mounts its own `LessonStudyShell` |
| 3 | `VocabTrainerPage` | Phase 0 seam, `contained` |
| 4 | `LessonSummary` | footer actions hidden |
| 5 | `LessonCardStudy` | direct; do not mount `LessonStudyShell` |
| 6 | `LessonTrainerPage` | Phase 0 seam, `contained` |

**Removed** from the milestone view (not from the components):
- the Word/Lesson Summary tab bar, `app/learner/lesson/page.tsx:70-89`
- the Learn/Train footer buttons in `WordSummary` / `LessonSummary`

**Kept:** `LessonStudyShell` + `LessonSidebar`. With soft gating the sidebar is
how a learner reaches other parts, Grammar and Translation — removing it would
hard-gate the flow by accident.

**`hideActions` is a new prop, and it is required.** Omitting `onLearn`/`onTrain`
today renders the buttons **disabled, not hidden** — `LessonSummary.tsx:158`
says so explicitly ("the read-only view leaves these disabled"). The milestone
needs them gone, so both summaries need an explicit flag.

### 10.7 Book parts

`/learner/lesson` branches on `passage.book_code`:

- book part → today's tabbed page, unchanged
- HSK part → `MilestoneRunner`

Books have no curated vocab (`LessonSummary.tsx:160`), so steps 1–3 have no
content and the milestone does not apply. Two modes in one route is the
deliberate cost of not inventing a 3-step variant.

### 10.8 Sequencing

Land this **after** Phase 0 (the trainer seams and the `contained` chrome are
prerequisites for steps 3 and 6) and independently of Phases 1–3. The
`/learner/lesson` route can ship the milestone before the dashboard exists;
Phase 4 then mounts the same component.

### 10.9 Tests

```
Flask   tests/test_lesson_milestone_routes.py
        GET derives 6/6 from lesson_trainer_completed_at with no stored rows;
        GET fills in every step below the highest completed;
        POST is idempotent (ON CONFLICT DO NOTHING keeps the first timestamp);
        step 3 derives from full word mastery, not from a stored row.

Next    tests/hooks/lesson/useLessonMilestone.test.ts   advance, resume, replay
        tests/components/milestone/MilestoneRunner.test.tsx
               passive step advances on Continue;
               graded step does NOT advance below the pass threshold;
               a book passage renders the legacy page, not the milestone.
```

### 10.10 Open question

What happens at the end of step 6 — does Continue navigate straight into Part 2's
milestone at step 1, or show a "part complete" screen first? Not decided; it
does not block the rest of the build.
