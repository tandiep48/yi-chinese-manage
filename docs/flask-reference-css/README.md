# Flask reference CSS (responsive source of truth)

These are the **original Flask/Jinja learner stylesheets**, copied verbatim so the
Next.js learner pages can be made responsive to **match the behavior of the old
Flask app** (the mobile-first responsive work tracked for `/learner/*`).

They are a **read-only reference**. Do not import or ship them — the live styles
live in the scoped `.css` files next to each learner component.

## Provenance

- **Source repo:** `Learning/` (Flask backend), `web_app/static/`
- **Captured from commit:** `1531863` — _"Vocab page: replace native multi-select with custom dropdown"_ (2026-07-15)
- **Why copied here:** the `static/` and `templates/` folders have since been
  **removed from the live `dev_version_2.0` branch** as the Next.js port progressed.
  At capture time the only surviving copy was a detached-HEAD worktree snapshot
  (`Learning/.claude/worktrees/recommend-perf-review-page-d21473/`), which is
  disposable. Committing the files here guarantees the responsive reference
  survives regardless of that worktree.
- **Responsive footprint of the reference:** 28 `@media` rules across 17 of 25 files.

## Flask file → Next.js learner surface

| Flask static file | Next.js scoped CSS / page |
| --- | --- |
| `shared/sidebar.css` | `components/layout/learner-nav.css` + `LearnerSidebar.tsx` |
| `shared/styles.css` | `app/styles/*` (tokens/base) |
| `shared/auth.css` | `app/learner/login`, `app/learner/register` |
| `shared/level_select.css`, `passage_picker.css` | `components/page/learner/picker/*` |
| `shared/vocab_table.css` | `components/page/learner/vocab/*` |
| `shared/recommend_cards.css` | `components/page/learner/recommend/*`, home tabs |
| `shared/success_popup.css` | shared success/toast UI |
| `dashboard/dashboard.css` | `components/page/learner/home/*` |
| `lesson/lesson.css` | `components/page/learner/lesson/*` |
| `lesson/pinyin.css` | `components/page/learner/pinyin/*` |
| `learning/learning.css` | `components/page/learner/lesson-training/*`, `trainer/*` |
| `practice/practice.css`, `practice_select.css`, `practice_lesson_select.css` | `components/page/learner/practice/*` |
| `vocab/vocab.css`, `vocab_select.css`, `vocab_training.css` | `components/page/learner/vocab/*` |
| `vocab_learning/vocab_learning.css` | `components/page/learner/vocab-learning/*` |
| `review/review.css` | `components/page/learner/vocab-review/*`, profile review panel |
| `profile/profile.css` | `components/page/learner/profile/*` |
| `grammar/grammar.css` | `app/learner/grammar` |
| `recommend/recommend.css` | `components/page/learner/recommend/*` |
| `competition/competition.css` | `components/page/learner/competition/*` |
| `reading/reading.css` | `app/learner/translation`, passage reading views |

> Mapping is a guide, not exact — some Flask pages were split across several
> scoped files during the port. When matching responsive behavior, compare the
> relevant `@media` blocks here against the target scoped CSS.
