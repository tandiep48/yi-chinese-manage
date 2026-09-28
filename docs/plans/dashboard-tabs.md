# Learner dashboard → tabbed learning container

> **Status: all six phases built, 2026-09-20.** Uncommitted on `dev` (frontend)
> and `dev_version_2.0` (Flask), per CLAUDE.md 3.4.
>
> **Two steps remain before the milestone can run at all**, both outside what
> this session could do:
> 1. Apply `schema_sql_file/schema.sql` (it holds the `user_lesson_milestone`
>    table, alongside every other table — this project keeps one schema file).
> 2. Restart Flask — it runs `use_reloader=False`, so `/api/lesson/milestone`
>    still 404s until it is.
>
> The milestone was verified against the real database on 2026-09-23 (backfill
> derives 6/6 from existing progress; writes are idempotent). Anything needing a
> signed-in *browser* session is still unverified — the built-in browser has no
> Flask cookie. Tests cover those paths.
>
> Two bugs reported from use were fixed on 2026-09-23 — see below.

## Post-launch fixes — 2026-09-23

Two problems reported from real use, after all six phases landed.

### 1. Word Review -> Lesson -> Word Review did nothing

`useLearnerHome.setRun` wrote **both** `tab` and `run`, rebuilding the query from
the `searchParams` captured when its closure was created. `MilestoneRunner`'s
unmount cleanup calls `onRunningChange(false)` -> `setRun(null)`, and that cleanup
runs *after* the tab switch has already written `?tab=review` — from a closure in
which `tab` was still `"lesson"`. It put the old tab straight back, so the click
looked like it did nothing.

Fixed by splitting the writers by what they own: `setRun` touches only `run`,
`writeTab` owns `tab` (and clears `run`). Both now merge onto
`window.location.search` rather than a captured `searchParams` — `router.replace`
updates the location synchronously, so the live URL is the one source that is
never a render behind. `LessonTab`'s `?step=` writer had the same hazard and got
the same treatment.

The regression test is in `tests/hooks/home/useLearnerHome.test.tsx`; reverting
the fix makes it report `/learner?tab=lesson` where `/learner?tab=review` is
expected. Note the test's router mock now actually moves `window.location` — with
the old mock, which only recorded calls, this race could not be reproduced at all.

### 2. Every tab switch re-ran every panel's fetch

Measured in the browser first. Two separate things:

- **The x2 on each request is React StrictMode**, whose double-invoked mount
  effect is dev-only. The two calls landed 2ms apart, in the same tick. Not a bug,
  and not "fixed".
- **The real cost is the mount policy.** Phase 1 unmounts the inactive panel, so
  returning to a tab re-runs its mount read — including `GET /api/vocab/review`,
  the ~1.6s full-table endpoint from §4.

Rather than re-litigate the locked mount policy (unmounting is what keeps a
trainer's answers flushed and the guard meaningful), the *result* is cached:
`lib/api/readCache.ts`, a small TTL map used by `useVocabReview` (page 1 only),
`useRecommend` and `useCurrentLesson`. A failure is never cached — a sticky error
would survive every remount and look like a dead tab — and concurrent callers join
the in-flight promise, which also collapses StrictMode's duplicate.

Staleness is handled where it is created: a finished run invalidates the keys it
affects (`ReviewTab`, `RecommendTab` and `MilestoneRunner` on trainer exit).

`vitest.setup.ts` clears the cache before every test; a module-scope cache leaking
between tests silently satisfies the next test's mount and its mock never fires.

**Measured after the fix**, with the two list endpoints stubbed to 200 so the
success path is exercised: six tab switches after priming cost **1** list request,
down from one per switch (two in dev).

---

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

### Phase 0 — Make the shared pieces embeddable (no UI change) — **DONE 2026-09-20**

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
- Same shape: `{ passageIds?, mode?, types?, onExit? }`.
- Its entry effect (`:123`) also has `router.replace` escapes for the pinyin
  placeholders (`H1_1_1`, `H1_1_2`) and `H1_5_99`. In embedded mode these must
  become a rendered message, not a navigation — the container has nowhere to go.
  Done as a `blockedKey: string | null` on the hook's return (an i18n key, not
  prose); `LessonTrainerPage` renders it in place of the run. The empty-task-list
  and failed-`startLessonSession` escapes got the same treatment — they were
  `router.replace(homeHref())` too.
- ~~Same flush-on-unmount.~~ **Not needed, and not added.** Unlike the vocab
  trainer there is no pending batch: `submitLessonAnswer` fires per answer in
  `onResolved`, and `completeLessonPart` only runs at `finish()`. An unmount
  mid-run has nothing buffered to lose, so a flush hook here would be dead code.

**`hooks/practice/usePracticeEngine.ts`**
- Already fully props-driven (`PracticeEngineOptions`, `:37`). Only add
  `referrer?: ReferrerInfo` to override the `sessionStorage("practice_referrer")`
  read at `:80`, and `onExit?`.
- Multi mode reads `sessionStorage("multi_practice_queue")`; add an optional
  `items?: PracticeMultiItem[]` to bypass it. An empty embedded queue sets
  `error: "load_failed"` instead of the `window.location.href` escape.
- `onExit` surfaces as `engine.exit`, because the back control is a `<Link
  href={referrer.href}>` in two places in `PracticeRunner` — embedded, both
  render a `<button>` instead. `engine.retry` still does a full
  `window.location.reload()`; that needs an embedded path before Phase 3 wires
  the Recommend tab.

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

`VocabTrainerPage` / `LessonTrainerPage` take the hook options plus `contained`
as props, so a panel mounts the page component rather than re-assembling the
shell. With no props both are byte-identical to the standalone routes.

**Exit criteria — met.** `tsc` clean; lint at 41 problems (36 errors, 5
warnings), the baseline exactly; 349 tests pass across 47 files, including
`tests/hooks/{vocab/useVocabTrainer,lesson/useLessonTrainer,practice/usePracticeEngine}.test.tsx`
(27 new), each of which pins the standalone path as well as the embedded one.

New i18n keys: `trainer.not_a_graded_part`, `trainer.no_part_selected`,
`trainer.no_tasks`, `trainer.load_failed` (en + vi).

### Phase 1 — The shell — **DONE 2026-09-20**

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

Route: `app/learner/home-v2/page.tsx`, thin wrapper rendering `HomeShell`. The
`<Suspense>` boundary is required, not decorative: `useLearnerHome` reads
`useSearchParams`, which Next refuses to prerender outside one.

**Built as specified, with four decisions worth recording:**

1. **The words-due badge landed here, not in Phase 2.** It belongs to the tab bar,
   which the shell owns, and §4's request budget already counts it at dashboard
   mount. `HomeShell` calls `getVocabReviewCount()` and soft-fails to no badge.
2. **The guard modal has its own `.learner-home-guard*` classes.** The existing
   quit modal can't be reused: `trainer-quit-modal.css` is scoped under
   `.trainer-shell` and its open state depends on a keyframe declared in
   `trainer-shell.css`, so it only works inside that root — which is the nesting
   §2 forbids. Same interaction, own markup.
3. **`sessionActive` is derived from `?run=`**, not held in React state, so the
   guard survives the refresh the URL state exists to support.
4. **The Lesson tab is a stand-in until Phase 4.** It mounts `RecentLessonPanel`
   (one request, its own `.learning-recent-panel` root) plus a line of copy.
   `CurrentLessonCard` was deliberately not used: its CSS lives under
   `.ui2-dashboard` in `dashboard.css` and would render unstyled here.

`ReviewTab` / `RecommendTab` mount `VocabReviewPage` / `RecommendPage` behind a
new `embedded` prop that hides their back-to-dashboard link. They are otherwise
unchanged, so starting a run still navigates away — that is exactly what Phases 2
and 3 replace.

**Verified in-browser 2026-09-20** at `/learner/home-v2`, signed out (the
built-in browser has no Flask session; the only console errors are the resulting
401s):

- Tablist correct — roving tabindex 0/-1/-1, `aria-controls` ↔ `aria-labelledby`.
- Clicking a tab swaps the panel and writes `?tab=`; loading `?tab=recommend`
  directly opens on Recommend, so refresh survives.
- Exactly one panel is mounted at a time, and its root is a direct child of
  `.learner-home-panel`: `.vocab-review`, `.recommend-page` — the §2 DOM shape.
- The guard opens on a tab click with `?run=` set and writes nothing; Cancel
  keeps `?run=`, Confirm drops it and switches.
- **The invariant holds against the live CSSOM, not just the source file.** A walk
  of every loaded stylesheet found zero rules mentioning `learner-home` whose
  rightmost compound lacks an owned class.
- At 375px: no horizontal page scroll, the tab bar scrolls sideways, 16px gutters.

**Exit criteria — met.** `tsc` clean; lint at 41 problems (36 errors, 5
warnings), the baseline; 385 tests pass across 50 files (36 new); `next build`
emits `/learner/home-v2` as a static route.

`hooks/home/*` was added to `LEARNER_ONLY` in `eslint.config.mjs` —
`tests/config/importBoundaries.test.ts` fails on any hooks domain folder that
isn't restricted from manager code.

### Phase 2 — Word Review tab — **DONE 2026-09-20**

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
  count. *(Landed in Phase 1 — it belongs to the tab bar.)*

**Built as specified. Four things worth recording:**

1. **The embedded path costs one request fewer than planned, not one more.**
   `/api/vocab/review` and `/api/vocab/words` both return `normalize_vocab_row()`
   output (`vocab_routes.py:508` and `:528`), so the rows the list already holds
   *are* trainer rows. `useVocabReview` now also exposes `selectedRows` (the
   selection Map's values, not just its keys) and `ReviewTab` hands those straight
   to `useVocabTrainer({ words })`. The standalone route still pays for the
   `POST /api/vocab/words` resolve, because its selection crosses a navigation as
   bare strings.
2. **The seam is `onStart?: (rows) => void` on `VocabReviewPage`**, not a fork.
   `useVocabReview` stays the single source and the list needed no extraction —
   with no `onStart`, `startTraining` is the original sessionStorage + `push` path,
   untouched.
3. **A reload with `?run=` set but no selection falls back to the list.** The
   selected rows live in memory, not the URL — a few hundred words don't belong in
   a query string — so `ReviewTab` clears `?run=` rather than mounting an empty
   trainer.
4. **The badge re-counts when a run ends.** `HomeShell`'s count effect depends on
   `home.run` and returns early while one is in flight: training words is what
   changes the number, and a stale badge after a session would be visibly wrong.
   Switching tabs doesn't touch `run`, so it costs nothing.

**The tab bar is now `position: sticky`.** Measuring the contained trainer found
it scrolling out of view under a tall panel, which contradicts the locked decision
in §1 ("tab bar stays visible"). `.learner-home` also changed from grid to flex
column for this: a sticky grid item is confined to its own grid area — an `auto`
row exactly its own height — so it would never have moved.

**Verified in-browser 2026-09-20**, signed out, so the flow itself (list → in-panel
trainer → back) rests on `tests/components/home/ReviewTab.test.tsx`. What was
measured live is the geometry, with the real rules and the planned DOM:

| | at scrollTop 0 | 500 | 1200 |
|---|---|---|---|
| tab bar offset from scroller top | 16px (natural) | **0** | **0** |
| bottom bar offset from scroller bottom | 34px (natural) | **0** | **0** |
| bar contained in the panel | yes | yes | yes |
| bar spans the viewport (the `fixed` bug) | no | no | no |

No `overflow`, `transform` or `contain` anywhere in the ancestor chain — the three
things that silently break sticky. The live CSSOM walk still finds zero §2
violations across every loaded stylesheet.

### Phase 3 — Recommend tab — **DONE 2026-09-20**, minus one deferred deletion

- `RecommendTab.tsx` reuses `RecommendPage`'s filters, grid and multi-select via
  `hooks/useRecommend`.
- `useRecommend.startSelected` currently stashes `multi_practice_queue` +
  `practice_referrer` then redirects. In embedded mode, pass the items to
  `PracticeRunner` through the new `items` / `referrer` options instead.
- `PracticeRunner` is already props-driven, so this tab is mostly wiring.

**Built as specified. Two things worth recording:**

1. **`engine.retry` needed an embedded path — the risk flagged in Phase 0 came
   due.** "Try again" on the result screen is `window.location.reload()`, which
   inside a panel reloads the whole dashboard. `usePracticeEngine` now takes
   `onRetry?`, and `RecommendTab` bumps a `key` to remount the runner: the session
   loads in a mount effect, so a remount *is* a fresh run, and only the panel is
   affected.
2. **The seam is `onStartMulti?: (items) => void`**, threaded
   `RecommendTab → RecommendPage → useRecommend`. With no callback, `startSelected`
   is the original `multi_practice_queue` + `practice_referrer` + `location.href`
   path, untouched — the standalone `/learner/recommend` route is unchanged.

Same `?run=` discipline as Phase 2: the queue lives in memory, so a reload with
`?run=practice-multi` but no items falls back to the grid.

**Verified in-browser 2026-09-20**, signed out, so the run itself rests on
`tests/components/home/RecommendTab.test.tsx` (the back control is asserted to be
a `<button>`, not the standalone route's `<Link>`). Live: the panel mounts
`.recommend-page` as a direct child of `.learner-home-panel`, the back-to-dashboard
link is suppressed, the tab bar is still `position: sticky`, and the CSSOM walk
finds zero §2 violations.

One false alarm worth noting for whoever hits it next: the dev server served a
stale Turbopack chunk after an import was removed, reporting `useT is not defined`
from a file that no longer references it. `rm -rf .next/cache` and a restart
cleared it; `tsc`, lint and the tests were clean on the source throughout.
- ~~**Delete `components/page/learner/dashboard/dashboard-rec-card.css` and the
  inline card markup in `RecommendedSection.tsx`.**~~ **Deferred to Phase 6.**

  The diagnosis stands: it is a non-interactive duplicate of `RecommendCard.tsx`
  (CLAUDE.md 1.3) and the source of 18 of the 30 name collisions. But the swap
  can't be made here without breaking the live dashboard. `RecommendedSection`'s
  only consumer is `app/learner/page.tsx` (verified), which renders it inside
  `.ui2-dashboard`; `RecommendCard` imports `recommend-card.css`, whose 23 rules
  are all scoped `.recommend-page .…`. Dropping the real card into the old
  dashboard would render it unstyled, and re-scoping that stylesheet to work under
  both roots is precisely the cross-root coupling §2 exists to prevent.

  Deferring costs nothing, because the collision it guards against cannot occur:
  `.ui2-dashboard` and `.recommend-page` are on different routes and never share
  a document. Phase 6 deletes `RecommendedSection.tsx` and `dashboard-rec-card.css`
  outright — they are already on its list — so the duplicate dies there instead.

### Phase 4 — Lesson tab = the milestone — **DONE 2026-09-20**, pending a table + a Flask restart

Biggest, highest risk. Do it last. Fully specified in §10.

The Lesson tab does not get its own sub-view machine — it mounts the shared
`MilestoneRunner` from §10, the same component `/learner/lesson` mounts. The
tab supplies the `passage_id` from `useDashboardHome().lesson`; everything else
is the milestone's own state.

`?run=` from Phase 1 becomes `?step=` (1–6) inside the lesson tab.

### Phase 5 — Statistics → profile — **DONE 2026-09-20**

- Move `LearningStatistics.tsx` + `MiniBarChart.tsx` + `dashboard-stats.css` into
  `components/page/learner/profile/`, re-scoped from `.ui2-dashboard` to
  `.profile-page`. The stylesheet is now `profile-stats.css` — keeping
  "dashboard" in a profile file would be exactly the stale naming 60df846
  cleaned up.
- Move the `getGlobalStats` / `getLearnedWordsLast3Days` / `getTimeLearnedLast3Days`
  calls out of `useDashboardHome` into the profile hook → `hooks/profile/useProfileStats.ts`.
- Verify with the postcss walk that no rule was dropped in the re-scope.

**The postcss walk, run:** 84 declaration-rows before, 92 after, **0 dropped**.
The 8 additions are all deliberate (below).

**Three things the plan's one-line description didn't cover:**

1. **Seven tokens had to come along.** The block uses 12 custom properties;
   `.profile-page` already declared five of them, but `--primary-light`,
   `--text-light`, `--bg-color`, `--ui-radius{,-sm,-lg}` and `--ui-shadow-{sm,md}`
   were declared on `.ui2-dashboard` in `dashboard.css`, which no longer wraps
   the block. They are added at the top of `profile-stats.css`. `--primary`,
   `--secondary`, `--card-bg`, `--text-main` and `--text-muted` are deliberately
   **not** redeclared: the block adopts the profile page's sage palette rather
   than carrying the dashboard's teal into a page that isn't teal.
2. **The block's own section header was dropped.** Its `.section-header` /
   `.title-wrapper` / `.tag` markup is styled by `dashboard.css`, not by the
   stylesheet that moved, so it would have rendered unstyled. The profile page
   gives every block its heading through `.profile-section > h2`, the same way
   `ReviewPanel` gets one, so the component now renders from `.stats-overview`
   down and `ProfilePage` supplies the `<h2>`.
3. **Re-scoping under `.profile-page` is safe**, checked rather than assumed: a
   leaf-class scan found **0 collisions** between the 13 classes the block owns
   and either `profile-page.css` or `review-panel.css`. This is the same check
   §2 demands before nesting two roots.

`app/learner/page.tsx` no longer renders the block at all, per the §1 locked
decision ("not kept on the dashboard"), which takes the old dashboard's mount
from 5 requests to 2 today rather than waiting for Phase 6.

**Verified in-browser 2026-09-20** at `/learner/profile`: all 8 added tokens
resolve, `.stats-overview` computes `border-radius: 24px` (`--ui-radius-lg`) and
`box-shadow: rgba(0,122,97,.08) 0 4px 20px` (`--ui-shadow-md`), and the heading
comes from `.profile-section > h2`. At `/learner`, `.stats-overview` is gone and
`.recommended-section` is the only section left.

### Phase 6 — Swap and clean up — **DONE 2026-09-20**

- Point `app/learner/page.tsx` at `HomeShell`; delete `app/learner/home-v2/`. ✓
- Delete `CurrentLessonCard.tsx`, `ReviewCard.tsx`, `RecommendedSection.tsx`,
  `dashboard.css`, and whatever remains of `dashboard-rec-card.css` /
  `dashboard-stats.css` (CLAUDE.md 2.4). ✓ — the whole
  `components/page/learner/dashboard/` folder is gone, which also settles the
  deletion deferred from Phase 3.
- **`useDashboardHome` was retired, not trimmed.** One caller was left
  (`LessonTab`) using one field (`lesson`), so what survives is
  `hooks/lesson/useCurrentLesson.ts`: one request, one concern, in the domain
  folder it belongs to. Retiring it also dropped a
  `react-hooks/set-state-in-effect` error — **lint is now 40 problems (35 errors,
  5 warnings), one better than the 41-problem baseline.**
- Re-run the collision scan. ✓ — and it earned its place, see below.

**The scan found two live defects from Phase 4.** Both are §2 bugs that the
invariant test cannot catch, because neither container's own stylesheet was at
fault:

1. **Milestone steps 1, 2, 4 and 5 rendered unstyled in the Lesson tab.**
   `word-summary.css`, `lesson-summary.css` and `flashcards.css` scope *every*
   rule under `.lesson-study`, and none of those components carries a root class
   of its own. `/learner/lesson` supplies that scope through `LessonStudyShell`;
   the dashboard panel has no shell, so four of the six steps had no styling at
   all there. `MilestoneRunner` now adds `.lesson-study` to its step frame — but
   **only for those four steps**. Wrapping the trainer steps too would have
   nested `.trainer-shell` under `.lesson-study` in both hosts, creating the very
   tie being fixed.
2. **`.lesson-study > .trainer-shell` is a real nesting, and it ties.** On
   `/learner/lesson` the milestone runs inside `LessonStudyShell`, so steps 3 and
   6 put a trainer inside `.lesson-study`. `.lesson-study .btn` and
   `.trainer-shell .btn` are both (0,2,0); so are the two `.app-container` rules.
   `trainer-shell.css` now restates the trainer's own values under
   `.trainer-shell.contained`, one class higher, so the winner is decided by
   specificity instead of chunk order.

**Verified in-browser 2026-09-20.** `/learner` serves the shell (`.learner-home`,
three tabs, `.vocab-review` in the panel, no `.ui2-dashboard` anywhere). For the
tie, a probe loaded the host rules **last** — the order that loses without the
fix — and the contained trainer still won every property: font-size 16px not
13.6px, background `#cbe2d4` not `#ffffff`, padding 15px not 0.55rem, and
`.app-container` padding 32px not 0.

**A caveat on the scan itself:** it compares leaf class *names*, so it still
reports `.lesson-study > .trainer-shell` as a TIE. It cannot see that
`.trainer-shell.contained` outranks; the browser probe above is the ground truth.
The script lives in this session's scratchpad, not the repo — it is a one-off
audit, unlike `tests/css/containerInvariants.test.ts`, which is permanent.

**Still unverified end to end:** anything needing a signed-in session. The
milestone in particular has never run against real data — it also needs
the `user_lesson_milestone` table applied from `schema_sql_file/schema.sql`
and Flask restarted (§10.11).

---

## 4. Request budget

| | Today | Target | Actual |
|---|---|---|---|
| Dashboard mount | 5 | **2** (current lesson + review count) | **2** — review count + current lesson. The old `/learner` is down to 2 as well, since Phase 5 took the three statistics reads off it |
| + Review tab | — | 1 (review list) | 1 — **and starting a run adds none**, see Phase 2 |
| + Lesson tab | — | 3 (parts, picker-progress, passage vocab) | 3 — milestone, passage detail, passage vocab; step 3 adds the `/api/vocab/words` resolve when reached |
| + Recommend tab | — | 1 | 1, plus `/api/vocab/has-history` only on an empty result |

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
tests/css/containerInvariants.test.ts    parses home-shell.css; fails on any
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

### 10.11 What was built — 2026-09-20

**Flask** (on `dev_version_2.0`, confirmed with the user — CLAUDE.md 3.1 names
`dev`, but the `/api/vocab/review/count` endpoint from §4 is already committed
there and splitting the two halves of this plan across branches would be worse):

```
web_app/entity/user_lesson_milestone/{__init__,entity,repository,service}.py
schema_sql_file/schema.sql                      + the user_lesson_milestone table
web_app/routes/lesson/lesson_routes.py          GET + POST /api/lesson/milestone
web_app/tests/test_lesson_milestone_routes.py   20 tests
```

426 Flask tests pass. Two things about the backend are worth knowing:

1. **There is no migration tooling in this project** — no Alembic, no
   `Base.metadata.create_all`, no existing `db/` SQL. The table has to be created
   by hand, so the DDL is a committed file with the psql command in its header.
   **Nothing works until it is run.**
2. **POST refuses steps 3 and 6 with a 400.** §10.5 says not to double-write
   them; making that a server-side refusal turns a convention into something the
   frontend cannot get wrong, and the tests pin it.

**Next** (on `dev`): `MilestoneRunner`, `MilestoneBar`, `milestone.css`,
`useLessonMilestone`, `lib/api/learner/milestone.ts`; `hideActions` on both
summaries; `shell` on `FlashcardStudy`; the `/learner/lesson` branch; `LessonTab`.
429 tests pass across 54 files (27 new), `tsc` clean, lint at the 41-problem
baseline, `next build` green.

**Two departures worth recording:**

1. **Step 3 resolves its words through `/api/vocab/words`**, the same call the
   standalone trainer makes, rather than reusing the summary's vocab rows. Phase 2
   could pass rows straight through because `/api/vocab/review` and
   `/api/vocab/words` both return `normalize_vocab_row()` output;
   `/api/lesson/vocab/<id>` does **not** — it returns `cn`/`hsk_level`, where a
   trainer row needs `word`/`level`. Mapping between them and hoping the shapes
   agree is exactly the kind of quiet drift the derived-steps design avoids, so
   the runner pays one request instead.
2. **`useLessonMilestone` keeps the viewed step separate from `current_step`.**
   Gating is soft, so replaying step 2 must not rewind progress; `current_step`
   only seeds the initial view.

**A bug found and fixed before shipping, with a regression test.** Both hosts
build `onStepChange` / `onRunningChange` from `useSearchParams`, so their identity
changes on every URL write. An effect depending on that identity fired its
cleanup (`onRunningChange(false)`) and then `(true)` again — each a URL write,
each changing `useSearchParams`: an infinite loop, not a wasted render. The
runner now holds both callbacks in a ref and depends only on the values it
reports. Reverting the fix makes
`tests/components/milestone/MilestoneRunner.test.tsx` report 7 calls where 1 is
expected.

**Not verified in-browser.** Two things block it and both are the user's to do:
the table does not exist yet, and Flask runs `use_reloader=False`, so the new
routes still 404 until it is restarted (`/api/vocab/review/count` answers 302 on
the same server, which is how the restart is confirmed). Signed out, the Lesson
tab correctly shows its no-lesson state.

### 10.10 Open question

What happens at the end of step 6 — does Continue navigate straight into Part 2's
milestone at step 1, or show a "part complete" screen first? Not decided; it
does not block the rest of the build.
