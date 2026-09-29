# Deploying Yi Chinese to DigitalOcean App Platform

This app ships as **one App Platform app** with two components and one managed
Postgres database:

| Component | Repo | Branch | Build | Serves |
|-----------|------|--------|-------|--------|
| `web` | `tandiep48/yi-chinese-manage` | `master` | `Dockerfile` (Next.js standalone) | everything except `/api`, `/socket.io` |
| `api` | `tandiep48/Learning` | `main_2.0` | `web_app/Dockerfile` (Flask + gunicorn eventlet) | `/api/*`, `/socket.io/*` |
| `db`  | — | — | App Platform managed Postgres | — |

**One origin, no CORS.** App Platform routes `/api` and `/socket.io` to the `api`
component and everything else to `web`. The frontend is built with
`NEXT_PUBLIC_API_URL=""`, so the browser calls the API and the Socket.IO server
on the **same origin** — no cross-site cookies, no CORS preflights. The Flask
session cookie just works.

The spec lives in [`.do/app.yaml`](.do/app.yaml).

---

## 1. Prerequisites (one-time)

1. **Connect GitHub.** In the DO control panel go to
   **[Settings → Integrations → GitHub](https://cloud.digitalocean.com/account/api/integrations)**
   (or accept the "Manage Access" prompt the first time you pick a repo during
   app creation). Grant the **DigitalOcean** GitHub app access to both
   `tandiep48/yi-chinese-manage` and `tandiep48/Learning` — App Platform can only
   watch repos it has been granted, and `Autodeploy` (`deploy_on_push`) needs this.
2. Have the GCS bucket name/URL ready and, if avatar uploads are needed, the
   Google service-account key JSON file.

## 2. Branch flow

- **Frontend** work happens on `dev` (per CLAUDE.md); `web` deploys from
  **`master`**, so merge `dev → master` to release.
- **Backend** work and the `api` deploy both live on **`main_2.0`** (the active
  branch — `dev` is stale and would ship old code).

`deploy_on_push: true` means a push to those branches redeploys the matching
component automatically.

## 3. Create the app (dashboard)

> **Note:** The control panel has **no "upload/paste YAML" button on the create
> screen** — that only exists for `doctl`/the API. The reliable web workflow is a
> two-step one: create a minimal app by connecting one repo through the UI, then
> **replace its whole spec** with [`.do/app.yaml`](.do/app.yaml) from
> **Settings → App Spec**. Step 3b makes the running app match this repo's spec
> exactly (both components + the managed DB), instead of hand-entering every field.

### 3a. Create a starter app from GitHub

1. In the control panel, click **Create** (top-right) → **App Platform**.
2. Under **Create from source code**, choose the **GitHub** tab. Authorize the
   DigitalOcean GitHub app if prompted (see §1).
3. **Repository:** select `tandiep48/yi-chinese-manage`. **Branch:** `master`.
   Leave **Source Directory** as `/`. Keep **Autodeploy** checked. Click **Next**.
4. On the **Resources** screen App Platform will detect the `Dockerfile`. Don't
   fine-tune anything here yet (§3b overwrites it) — just click **Next**.
5. Skip **Environment Variables** (**Next**) and, on **Info**, pick the **region**
   and confirm the app **name** is `yi-chinese`. Click **Next** → **Create App**.

The first build will start; you can let it run or cancel it — the next step
redeploys anyway.

### 3b. Replace the spec with `.do/app.yaml`

1. Open the app's **Overview** page → **Settings** tab.
2. Scroll to the **App Spec** section → click **Edit**.
3. Select all the YAML in the in-browser editor and replace it with the full
   contents of [`.do/app.yaml`](.do/app.yaml). (Or use **Download**, edit locally,
   then **Upload**.)
4. Click **Save**. Confirm the changes in the diff/preview dialog.

App Platform re-reads the spec and provisions what was missing: the `api`
component (`tandiep48/Learning`, branch `main_2.0`, `web_app/Dockerfile`), the
routes for `/api` and `/socket.io`, and the managed `db`. It injects the DB
credentials into `api` as `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD` (from
`${db.*}`), and `DB_SSLMODE=require` sets the managed DB's TLS. The app
auto-redeploys after saving.

## 4. Set secrets

The `REPLACE_…` placeholders in `.do/app.yaml` ship as `type: SECRET`, so after
§3b they exist but hold the literal placeholder text. Give them real values:

1. Open the app → **Settings** tab.
2. In the **Components** list, click the **`api`** component.
3. Find the **Environment Variables** section → click **Edit**.
4. For each key below, paste the real value, make sure **Encrypt** is checked,
   then **Save** (the `api` component redeploys):

- `FLASK_SECRET_KEY` — a stable 64-char hex string (a random one per restart
  invalidates every session). Generate it locally with:
  ```bash
  python -c "import secrets; print(secrets.token_hex(32))"
  ```
- `GCS_SA_KEY_JSON` — *(optional)* the full service-account JSON, pasted as one
  value. Only needed for avatar uploads; public asset reads work without it. The
  container writes it to a file and points `GOOGLE_APPLICATION_CREDENTIALS` at it
  (see `web_app/docker-entrypoint.sh`). If uploads aren't used, delete this row
  from the spec/variables instead of leaving the placeholder.

> Once saved and encrypted, the value shows as `EV[1:…]` in **Settings → App
> Spec** — that's expected; do not paste that ciphertext back into the repo file.

## 5. Load the database schema + data

The managed DB starts empty. Get its connection string from the dashboard:

1. Open the app → **Settings** tab → click the **`db`** component (or find the DB
   under **Databases** in the left nav).
2. In **Connection Details**, choose **Connection string** and **Public network**,
   then copy it. This is your `DATABASE_URL` for the `psql`/Python steps below.
3. Under the DB's **Settings → Trusted Sources**, add the IP of the machine you'll
   run the import from (the managed DB rejects outside connections until you do).

Then, from a machine that has `psql` and Python:

1. Load the schema from the backend repo's `schema_sql_file/`:
   ```bash
   psql "$DATABASE_URL" -f schema_sql_file/<schema>.sql
   ```
2. Seed content with the repo's `web_app/scripts/import_*.py` (they read the same
   `DB_*` env vars) plus the dictionary workbook, as your data process requires.

## 6. Verify

Wait for both components to show **Deployed** (green) on the app's **Overview**,
then copy the app's public URL from the top of that page (`<app>.ondigitalocean.app`).

- `https://<app>.ondigitalocean.app/learner` renders the frontend.
- `https://<app>.ondigitalocean.app/api/...` returns JSON from Flask;
  `/` on the `api` component is its health check (green in **Overview**).
- Sign in and confirm the session cookie sticks (same-origin).
- Learn Together (Socket.IO) connects over `/socket.io`.
- If something 500s, open the failing component → **Runtime Logs** in the
  dashboard (build issues are under **Build Logs** on the deployment).

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
`cluster_name:` to attach an existing cluster) in **App → Settings → Edit your App
Spec**, then **Save** to re-apply. The `api` env bindings (`${db.*}`) don't change.

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
