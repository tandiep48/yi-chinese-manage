# Deploying Yi Chinese to Google Cloud (Compute Engine + Docker Compose)

The split app (new Next.js frontend + new Flask/Socket.IO backend) runs on **one
Google Compute Engine VM** as a small Docker Compose stack, fronted by nginx so
the browser talks to a **single origin** (no CORS, no cross-site cookies):

| Service | Source | Image | Role |
|---------|--------|-------|------|
| `nginx` | `deploy/nginx.conf` | `nginx:1.27-alpine` | Only public port (80/443); routes `/api` + `/socket.io` to `api`, else to `web` |
| `web`   | `tandiep48/yi-chinese-manage` @ `master` | `Dockerfile` (Next.js standalone) | Frontend |
| `api`   | `tandiep48/Learning` @ `main_2.0` | `web_app/Dockerfile` (Flask + gunicorn eventlet) | `/api/*`, `/socket.io/*` |
| `db`    | — | `postgres:18-alpine` | Self-hosted Postgres, private to the docker network, data in the `pgdata` volume |

Compose file: [`deploy/docker-compose.yml`](deploy/docker-compose.yml) ·
proxy: [`deploy/nginx.conf`](deploy/nginx.conf) ·
env template: [`deploy/env.example`](deploy/env.example).

> **Separate from the monolith.** This is a **new, dedicated VM** for the split
> app on `main_2.0` (Learning) + `master` (yi-chinese-manage). It does not touch
> the existing `Learning` `main` monolith deployment — different instance,
> different IP/domain.

> **Why one VM?** Cheapest option and a good fit: Flask-SocketIO must run a
> **single** eventlet worker (`WEB_CONCURRENCY=1`) unless you add a Redis message
> queue, so horizontal scaling isn't in play yet. Scale up (bigger machine type)
> before scaling out.

---

## 1. Prerequisites (one-time)

1. **Project & CLI.** Use your existing GCP project (or create one). Install the
   [`gcloud` CLI](https://cloud.google.com/sdk/docs/install) and
   `gcloud auth login`, or do the equivalent in the Cloud Console. Enable the
   **Compute Engine API** if it isn't already.
2. **VM instance.** Create a Compute Engine instance:
   - **Image:** Ubuntu 22.04 LTS.
   - **Machine type:** `e2-medium` (2 vCPU / 4 GB) recommended — the Next.js
     build is memory-hungry. `e2-small` (2 GB) works only with swap (see §3).
   - **Region/zone:** pick one near your users (no ICP/filing needed on GCP),
     e.g. `asia-southeast1` (Singapore).
   - **Firewall:** check **Allow HTTP traffic** and **Allow HTTPS traffic** (adds
     the `http-server`/`https-server` tags + rules for tcp:80/443).
3. **Static external IP.** Reserve a **static** external IP and assign it to the
   VM (an ephemeral IP changes on stop/start and would break the CI host secret):
   ```bash
   gcloud compute addresses create yi-chinese-ip --region=<region>
   # then attach it to the instance's network interface (Console or gcloud).
   ```
4. **SSH access for CI.** GitHub-hosted runners connect from a wide IP range, so
   the default `default-allow-ssh` rule (tcp:22 from `0.0.0.0/0`) is fine **as
   long as password auth is off and only key auth is used** (Ubuntu's default).
   Generate a dedicated deploy key and add its public half to the VM (§5).
5. Have the GCS bucket URL/name and, if avatar uploads are needed, the Google
   service-account key JSON.

## 2. Branch flow

- **Frontend** work happens on `dev` (per CLAUDE.md); `web` deploys from
  **`master`**, so merge `dev → master` to release.
- **Backend** work and the `api` deploy both live on **`main_2.0`**.

Pushing to those branches triggers the GitHub Actions deploy (§5), which
`git pull`s and rebuilds only the affected service on the VM.

## 3. First-time server setup

SSH into the VM (`gcloud compute ssh <instance> --zone=<zone>`) and install
Docker (Compose v2 ships as the `docker compose` plugin):

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"   # log out/in so this takes effect
```

*(e2-small / 2 GB only)* add swap so `next build` doesn't OOM:

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Lay out the project root and clone **both** repos side by side:

```bash
sudo mkdir -p /opt/yi-chinese && sudo chown "$USER" /opt/yi-chinese
cd /opt/yi-chinese
git clone -b master   https://github.com/tandiep48/yi-chinese-manage.git
git clone -b main_2.0 https://github.com/tandiep48/Learning.git
```

Create the runtime env from the template and fill in real values:

```bash
cp yi-chinese-manage/deploy/env.example .env
nano .env   # set PUBLIC_ORIGIN, POSTGRES_PASSWORD, FLASK_SECRET_KEY, GCS_*
```

- `FLASK_SECRET_KEY` — `python3 -c "import secrets; print(secrets.token_hex(32))"`
- `POSTGRES_PASSWORD` — a strong password (only used inside the docker network).
- `PUBLIC_ORIGIN` — `http://<VM_EXTERNAL_IP>` for now; switch to `https://<domain>`
  after §7.

Bring the stack up (builds all four services):

```bash
cd /opt/yi-chinese
cp yi-chinese-manage/deploy/docker-compose.yml docker-compose.yml
docker compose up -d --build
docker compose ps
```

## 4. Load the database schema + data

The `db` volume starts empty. Load the schema and seed data through the running
`db` container (no host Postgres client needed):

```bash
cd /opt/yi-chinese
# The db container already has POSTGRES_USER/POSTGRES_DB set — expand them INSIDE
# it via sh -c '...' (single quotes). Running `psql -U "$POSTGRES_USER"` directly
# would expand the vars in your host shell, where they are empty (they live in
# .env, which only Compose reads), and psql would fall back to your Linux login.
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  < Learning/schema_sql_file/schema.sql
```

Seed content with the backend's `web_app/scripts/import_*.py`. Run them inside
the `api` container so they reuse its `DB_*` env and dependencies:

```bash
docker compose exec api python scripts/import_<name>.py
```

> **Backups (your responsibility with a self-hosted DB):** schedule a daily dump,
> e.g. a cron entry running
> `docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > /opt/yi-chinese/backups/db-$(date +\%F).sql.gz`
> and copy it off-box (a GCS bucket via `gsutil`). Consider migrating to
> **Cloud SQL for PostgreSQL** later if you want managed backups/HA.

## 5. Continuous deploy (GitHub Actions → SSH)

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) redeploys `web` on
every push to `master`. Add the same workflow to the **Learning** repo on
`main_2.0`, changing only the last line to run `deploy.sh api`:

```yaml
# .github/workflows/deploy.yml in tandiep48/Learning
name: Deploy backend to GCE
on:
  push: { branches: [main_2.0] }
  workflow_dispatch: {}
concurrency: { group: deploy-api, cancel-in-progress: false }
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.GCE_HOST }}
          username: ${{ secrets.GCE_USER }}
          key: ${{ secrets.GCE_SSH_KEY }}
          script: /opt/yi-chinese/yi-chinese-manage/deploy/deploy.sh api
```

Generate a deploy key and register it on the VM:

```bash
ssh-keygen -t ed25519 -f yi-deploy -C "github-actions"   # no passphrase
# append yi-deploy.pub to the VM user's ~/.ssh/authorized_keys
```

In **each** repo's **Settings → Secrets and variables → Actions**, add:

- `GCE_HOST` — the VM's **static** external IP.
- `GCE_USER` — the SSH user on the VM (the one that owns `/opt/yi-chinese`).
- `GCE_SSH_KEY` — the **private** key (`yi-deploy`) whose public half is in
  `authorized_keys`.

[`deploy/deploy.sh`](deploy/deploy.sh) does the work on the VM: pulls the repo,
`docker compose up -d --build <service>`, and prunes old images. Run it by hand
too: `deploy.sh web`, `deploy.sh api`, or `deploy.sh all`.

> Prefer no public SSH? GCP supports deploying over the **IAP tunnel** with
> Workload Identity Federation (no open port 22, no long-lived key). It's more
> setup; the plain-SSH flow above is the quick path.

## 6. Verify

```bash
docker compose ps          # all services "running"; db is "healthy"
docker compose logs -f api # watch for startup / DB-connection errors
```

Then from a browser (or `curl`) against `http://<VM_EXTERNAL_IP>`:

- `/learner` renders the frontend.
- `/api/...` returns JSON from Flask.
- Sign in and confirm the session cookie sticks (same-origin).
- Learn Together (Socket.IO) connects over `/socket.io`.

## 7. Domain + HTTPS (recommended)

1. Point an A record at the VM's static external IP.
2. Issue a cert (Let's Encrypt via certbot on the host, or a Google-managed cert
   if you later front the VM with a load balancer), mount it into nginx
   (uncomment the `443` port and `./certs` volume in the compose file), add a
   `listen 443 ssl;` server block to `nginx.conf`, and redirect 80 → 443.
3. Set `PUBLIC_ORIGIN=https://<domain>` in `.env` and rebuild `web`
   (`deploy.sh web`) so the frontend and cookie origin match.

---

## Backend specifics

- **Server:** `gunicorn --worker-class eventlet --workers 1` (see
  `web_app/docker-entrypoint.sh`). Keep `WEB_CONCURRENCY=1` until a Redis message
  queue is added; more than one worker breaks Socket.IO rooms/broadcasts.
- **ffmpeg** is baked into the image (decodes browser audio for the speaking check).
- **Vosk speaking model** is *not* bundled by default. The rest of the API works
  without it; only the speaking endpoint errors until a model is present. To
  include it, uncomment `INCLUDE_VOSK_MODEL: "true"` under the `api` build args in
  the compose file, or set `VOSK_MODEL_PATH` to a model you mount.
- **Database TLS:** unset — the app talks to the `db` container over the private
  docker network in plaintext. Only set `DB_SSLMODE` for an external TLS Postgres
  (e.g. if you move to Cloud SQL).

## Frontend specifics

- `next.config.ts` sets `output: "standalone"`; the image runs `node server.js`.
- `NEXT_PUBLIC_*` are **build-time** (inlined into the client bundle), passed as
  build args in the compose file. Changing them needs a rebuild (`deploy.sh web`),
  not just a restart.
- At launch, flip the `/learner` redirects in `next.config.ts` from `permanent:
  false` (307) to `true` (308) once the paths stop moving (noted in that file).

## Local smoke test

The compose file expects both repos side by side, so mirror the VM layout:

```bash
mkdir yi-local && cd yi-local
git clone https://github.com/tandiep48/yi-chinese-manage.git
git clone https://github.com/tandiep48/Learning.git
cp yi-chinese-manage/deploy/env.example .env     # set PUBLIC_ORIGIN=http://localhost
cp yi-chinese-manage/deploy/docker-compose.yml docker-compose.yml
docker compose up --build
```

Open `http://localhost/learner` — nginx routes `/api` and `/socket.io` to Flask
exactly as in production.
