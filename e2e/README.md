# e2e — learner responsive guard

Playwright viewport checks that assert no `/learner/*` page overflows its
viewport at phone / tablet / desktop widths. Separate from the Vitest unit suite
(`npm test`); run with `npm run test:e2e`.

## Layout

- `playwright.config.ts` (repo root) — projects `mobile-393`, `tablet-768`,
  `desktop-1280`; reuses a dev server on :3000 or starts `npm run dev`.
- `responsive.public.spec.ts` — routes that need no login.
- `responsive.auth.spec.ts` — authenticated routes; skipped without creds.
- `auth.setup.ts` — logs in once and caches the session to `e2e/.auth/` (gitignored).
- `helpers/overflow.ts` — the overflow probe + `expectNoHorizontalOverflow`.
- `helpers/routes.ts` — the route lists.

## Running

```bash
# public routes at all three widths
npm run test:e2e

# include authenticated routes — needs the Flask backend on :5000
E2E_USERNAME=<learner> E2E_PASSWORD=<pass> npm run test:e2e

# one width / one route while fixing a page
E2E_USERNAME=<learner> E2E_PASSWORD=<pass> \
  npx playwright test --project=mobile-393 -g "overflow: /learner/vocab-review"
```

## What counts as a failure

An element whose right edge exceeds the viewport width. Elements parked off the
**left** edge (the closed off-canvas drawer) are ignored. A deliberate
horizontal-scroll region is allowed by marking its wrapper `data-overflow-ok`
(see `docs/responsive-conventions.md`).

## Not covered

Session-gated screens (lesson study/trainer, practice/exam runners, vocab
trainer, competition active screens) only render inside a live session and are
checked manually during fixes — see `docs/responsive-audit.md`.

## Env

| Var | Default | Purpose |
| --- | --- | --- |
| `E2E_USERNAME` / `E2E_PASSWORD` | — | test learner; auth routes skip if unset |
| `E2E_BASE_URL` | `http://localhost:3000` | app under test |
