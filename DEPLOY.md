# Deploying Yi Chinese to DigitalOcean App Platform

This app ships as **one App Platform app** with two components and one managed
Postgres database:

| Component | Repo | Branch | Build | Serves |
|-----------|------|--------|-------|--------|
| `web` | `tandiep48/yi-chinese-manage` | `master` | `Dockerfile` (Next.js standalone) | everything except `/api`, `/socket.io` |
| `api` | `tandiep48/Learning` | `dev_version_2.0` | `web_app/Dockerfile` (Flask + gunicorn eventlet) | `/api/*`, `/socket.io/*` |
| `db`  | — | — | App Platform managed Postgres | — |

**One origin, no CORS.** App Platform routes `/api` and `/socket.io` to the `api`
component and everything else to `web`. The frontend is built with
`NEXT_PUBLIC_API_URL=""`, so the browser calls the API and the Socket.IO server
on the **same origin** — no cross-site cookies, no CORS preflights. The Flask
session cookie just works.

The spec lives in [`.do/app.yaml`](.do/app.yaml).

---

## 1. Prerequisites (one-time)

1. Install the DO CLI: `doctl auth init`.
2. In the DO dashboard, connect GitHub and authorize the **DigitalOcean** app for
   both `tandiep48/yi-chinese-manage` and `tandiep48/Learning` (required for
   `deploy_on_push`).
3. Have the GCS bucket name/URL and, if avatar uploads are needed, the Google
   service-account key JSON.

## 2. Branch flow

- **Frontend** work happens on `dev` (per CLAUDE.md); `web` deploys from
  **`master`**, so merge `dev → master` to release.
- **Backend** work and the `api` deploy both live on **`dev_version_2.0`** (the
  active branch — `dev` is 77 commits behind and would ship stale code).

`deploy_on_push: true` means a push to those branches redeploys the matching
component automatically.

## 3. Create the app

```bash
doctl apps create --spec .do/app.yaml
```

This provisions `web`, `api`, and the managed `db`, and injects the DB
credentials into the `api` component as `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD`
(from `${db.*}` in the spec). `DB_SSLMODE=require` is set for the managed DB's TLS.

## 4. Set secrets

Placeholders in `.do/app.yaml` marked `REPLACE_…` must be set as encrypted values
(never commit them). In the dashboard (App → Settings → the `api` component →
Environment Variables), or via `doctl apps update <APP_ID> --spec …`:

- `FLASK_SECRET_KEY` — a stable 64-char hex string (sessions are invalidated on
  restart if this is random):
  `python -c "import secrets; print(secrets.token_hex(32))"`
- `GCS_SA_KEY_JSON` — *(optional)* the full service-account JSON, pasted as one
  value. Only needed for avatar uploads; public asset reads work without it. The
  container writes it to a file and points `GOOGLE_APPLICATION_CREDENTIALS` at it
  (see `web_app/docker-entrypoint.sh`). Remove this var if uploads aren't used.

## 5. Load the database schema + data

The managed DB starts empty. Connect with the credentials from
`doctl apps list` / the DB page (or `${db.DATABASE_URL}`), then:

1. Load the schema from the backend repo's `schema_sql_file/` (e.g.
   `psql "$DATABASE_URL" -f schema_sql_file/<schema>.sql`).
2. Seed content with the repo's `web_app/scripts/import_*.py` (they read the same
   `DB_*` env vars) and the dictionary workbook, as your data process requires.

> Tip: run these from a machine with `psql`/Python using the managed DB's
> connection string; the DB accepts external connections once you add your IP (or
> the app) to its trusted sources.

## 6. Verify

- `https://<app>.ondigitalocean.app/learner` renders the frontend.
- `https://<app>.ondigitalocean.app/api/...` returns JSON from Flask;
  `/` on the api component is the health check.
- Sign in and confirm the session cookie sticks (same-origin).
- Learn Together (Socket.IO) connects over `/socket.io`.

---

## Backend specifics

- **Server:** `gunicorn --worker-class eventlet --workers 1` (see
  `web_app/docker-entrypoint.sh`). `SOCKETIO_ASYNC_MODE=eventlet` is required in
  prod. **Keep `WEB_CONCURRENCY=1`** — Flask-SocketIO needs a shared message queue
  (e.g. a Redis component + `message_queue=`) before more than one worker/instance
  can broadcast correctly. Scale vertically (bigger instance) until then.
- **ffmpeg** is installed in the image (decodes browser audio for the speaking
  check).
- **Vosk speaking model** is *not* bundled by default, to keep the image small and
  the build offline-safe. The rest of the API runs fine without it; only the
  speaking endpoint errors until a model is present. To include it, build with
  `--build-arg INCLUDE_VOSK_MODEL=true` (downloads the small Chinese model), or set
  `VOSK_MODEL_PATH` to a model you provide.

## Frontend specifics

- `next.config.ts` sets `output: "standalone"`; the image runs `node server.js`.
- `NEXT_PUBLIC_*` are **build-time** (inlined into the client bundle), so they are
  scoped `RUN_AND_BUILD_TIME` in the spec. Changing them requires a rebuild, not
  just a restart.
- At launch, flip the `/learner` redirects in `next.config.ts` from `permanent:
  false` (307) to `true` (308) once the paths stop moving (noted in that file).

## Database: dev vs managed cluster

`.do/app.yaml` uses `production: false` — App Platform's smaller **dev database**,
which is still managed Postgres and fine to start on. For a dedicated managed
cluster (backups, larger sizes, standby), set `production: true` (and optionally
`cluster_name:` to attach an existing cluster), then re-apply the spec. The
`api` env bindings (`${db.*}`) don't change.

If you enforce certificate verification, switch `DB_SSLMODE` to `verify-full` and
supply the DB's CA cert (`${db.CA_CERT}`); `require` (the default here) encrypts
without verifying the CA.

## Local Docker smoke test

```bash
# Frontend
docker build -t yi-web --build-arg NEXT_PUBLIC_API_URL="" \
  --build-arg NEXT_PUBLIC_GCS_BUCKET_URL="https://storage.googleapis.com/chinese-learning-audio-assets" .
docker run --rm -p 3000:3000 yi-web

# Backend (from Learning/web_app)
docker build -t yi-api .
docker run --rm -p 8080:8080 --env-file .env yi-api
```

Same-origin routing (`/api`, `/socket.io`) is provided by App Platform's ingress,
so a local two-container test needs a reverse proxy in front to mirror it; for a
quick backend check, set `NEXT_PUBLIC_API_URL=http://localhost:8080` when building
the web image instead.
