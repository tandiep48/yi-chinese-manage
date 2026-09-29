# Deploying Yi Chinese to Alibaba Cloud (ECS + Docker Compose)

The whole app runs on **one Alibaba Cloud ECS VM** as a small Docker Compose
stack, fronted by nginx so the browser talks to a **single origin** (no CORS, no
cross-site cookies):

| Service | Source | Image | Role |
|---------|--------|-------|------|
| `nginx` | `deploy/nginx.conf` | `nginx:1.27-alpine` | Only public port (80/443); routes `/api` + `/socket.io` to `api`, else to `web` |
| `web`   | `tandiep48/yi-chinese-manage` @ `master` | `Dockerfile` (Next.js standalone) | Frontend |
| `api`   | `tandiep48/Learning` @ `main_2.0` | `web_app/Dockerfile` (Flask + gunicorn eventlet) | `/api/*`, `/socket.io/*` |
| `db`    | — | `postgres:16-alpine` | Self-hosted Postgres, private to the docker network, data in the `pgdata` volume |

Compose file: [`deploy/docker-compose.yml`](deploy/docker-compose.yml) ·
proxy: [`deploy/nginx.conf`](deploy/nginx.conf) ·
env template: [`deploy/env.example`](deploy/env.example).

> **Why one VM?** It's the cheapest option and fits this app: Flask-SocketIO must
> run a **single** eventlet worker (`WEB_CONCURRENCY=1`) unless you add a Redis
> message queue, so horizontal scaling isn't in play yet. Scale up (bigger ECS
> instance) before scaling out.

---

## 1. Prerequisites (one-time)

1. **Region / ICP.** For users outside mainland China, create the ECS in an
   **international region** (e.g. Singapore, `ap-southeast-1`). Mainland-China
   regions require an **ICP filing** to serve a public website on port 80/443 —
   a slow legal/manual process. Pick international unless you specifically need
   mainland hosting.
2. **ECS instance.** Ubuntu 22.04 LTS, at least **2 vCPU / 4 GB** (the Next.js
   build is memory-hungry; on a 2 GB box add swap — see §3). Assign a **public
   IP** (or bind an EIP).
3. **Security group.** Allow inbound **22** (SSH — restrict to your IP), **80**,
   and **443**. Do **not** open 5432; Postgres stays on the docker network.
4. **SSH key.** Create/hold an SSH key pair for the VM; you'll add the private
   key to GitHub for CI (§5).
5. Have the GCS bucket URL/name and, if avatar uploads are needed, the Google
   service-account key JSON.

## 2. Branch flow

- **Frontend** work happens on `dev` (per CLAUDE.md); `web` deploys from
  **`master`**, so merge `dev → master` to release.
- **Backend** work and the `api` deploy both live on **`main_2.0`**.

Pushing to those branches triggers the GitHub Actions deploy (§5), which
`git pull`s and rebuilds only the affected service on the VM.

## 3. First-time server setup

SSH into the VM and install Docker (Compose v2 ships as the `docker compose`
plugin):

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"   # log out/in so this takes effect
```

*(2 GB instances only)* add swap so `next build` doesn't OOM:

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
- `PUBLIC_ORIGIN` — `http://<ECS_PUBLIC_IP>` for now; switch to `https://<domain>`
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
# Schema (adjust the filename to the one in the backend repo):
docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  < Learning/schema_sql_file/<schema>.sql
```

Seed content with the backend's `web_app/scripts/import_*.py`. Run them inside
the `api` container so they reuse its `DB_*` env and dependencies:

```bash
docker compose exec api python scripts/import_<name>.py
```

> **Backups (your responsibility with a self-hosted DB):** schedule a daily dump,
> e.g. a cron entry running
> `docker compose exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > /opt/yi-chinese/backups/db-$(date +\%F).sql.gz`
> and copy it off-box (Alibaba OSS). Consider migrating to **ApsaraDB RDS for
> PostgreSQL** later if you want managed backups/standby.

## 5. Continuous deploy (GitHub Actions → SSH)

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) redeploys `web` on
every push to `master`. Add the same workflow to the **Learning** repo on
`main_2.0`, changing only the last line to run `deploy.sh api`:

```yaml
# .github/workflows/deploy.yml in tandiep48/Learning
name: Deploy backend to ECS
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
          host: ${{ secrets.ECS_HOST }}
          username: ${{ secrets.ECS_USER }}
          key: ${{ secrets.ECS_SSH_KEY }}
          script: /opt/yi-chinese/yi-chinese-manage/deploy/deploy.sh api
```

In **each** repo's **Settings → Secrets and variables → Actions**, add:

- `ECS_HOST` — the VM's public IP.
- `ECS_USER` — the SSH user (e.g. `root` or your sudo user).
- `ECS_SSH_KEY` — the **private** key whose public half is in the VM's
  `~/.ssh/authorized_keys`.

[`deploy/deploy.sh`](deploy/deploy.sh) does the work on the VM: pulls the repo,
`docker compose up -d --build <service>`, and prunes old images. Run it by hand
too: `deploy.sh web`, `deploy.sh api`, or `deploy.sh all`.

## 6. Verify

```bash
docker compose ps          # all services "running"; db is "healthy"
docker compose logs -f api # watch for startup / DB-connection errors
```

Then from a browser (or `curl`) against `http://<ECS_PUBLIC_IP>`:

- `/learner` renders the frontend.
- `/api/...` returns JSON from Flask.
- Sign in and confirm the session cookie sticks (same-origin).
- Learn Together (Socket.IO) connects over `/socket.io`.

## 7. Domain + HTTPS (recommended)

1. Point an A record at the ECS public IP.
2. Issue a cert (Let's Encrypt via certbot on the host, or an Alibaba SSL cert),
   mount it into nginx (uncomment the `443` port and `./certs` volume in the
   compose file), add a `listen 443 ssl;` server block to `nginx.conf`, and
   redirect 80 → 443.
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
  docker network in plaintext. Only set `DB_SSLMODE` for an external TLS Postgres.

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
