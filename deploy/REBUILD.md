# Rebuild / redeploy runbook

Use this when the GitHub Actions auto-deploy fails because it points at the wrong
host — e.g. the old Compute Engine instance was deleted/recreated and the VM's IP
changed, so `GCE_HOST` is stale. Two parts:

- **Part A** — rebuild and redeploy **now**, by hand, bypassing the broken CI.
- **Part B** — fix the auto-deploy so pushes to `master` / `main_2.0` work again.

Background: the stack lives on **one VM** at `/opt/yi-chinese` with both repos
side by side; code is **baked into the images at build time**, so every deploy is
a *rebuild*, not a restart. See [`DEPLOY.md`](../DEPLOY.md) for the full setup and
[`deploy/deploy.sh`](deploy.sh) / [`deploy/docker-compose.yml`](docker-compose.yml)
for what runs.

Deploy branches: **frontend `web` ← `master`**, **backend `api` ← `main_2.0`**.
(Day-to-day work is on `dev` / `dev_version_2.0`; nothing deploys until you merge
up to the deploy branch.)

---

## Part A — Rebuild & redeploy by hand (do this now)

### A1. Find the VM's current external IP

From your workstation (gcloud authenticated: `gcloud auth login`):

```bash
gcloud compute instances list
# Note the NAME, ZONE and EXTERNAL_IP of the running VM.
```

### A2. SSH into the VM

```bash
gcloud compute ssh <INSTANCE_NAME> --zone=<ZONE>
```

(Or `ssh <GCE_USER>@<EXTERNAL_IP>` if you have a key configured.)

### A3. Confirm the stack is there

```bash
cd /opt/yi-chinese
ls            # expect: yi-chinese-manage/  Learning/  .env  docker-compose.yml
docker compose ps
```

- If `/opt/yi-chinese` or either repo is **missing**, this VM was never set up —
  stop here and run the first-time setup instead (DEPLOY.md §3–§4), then come back
  to Part B.
- If `.env` is missing, recreate it from the template before building:
  `cp yi-chinese-manage/deploy/env.example .env && nano .env`
  (set `PUBLIC_ORIGIN`, `POSTGRES_PASSWORD`, `FLASK_SECRET_KEY`, `GCS_*`).

### A4. Pull the latest code and rebuild

`deploy.sh` pulls the deploy branch and runs `docker compose up -d --build` for the
chosen service (only changed layers rebuild, so it's reasonably fast; `db` and
`nginx` keep running):

```bash
/opt/yi-chinese/yi-chinese-manage/deploy/deploy.sh all   # or: web | api
```

Do the equivalent by hand if you prefer explicit control:

```bash
cd /opt/yi-chinese
# keep the running compose file in sync with the repo
cp yi-chinese-manage/deploy/docker-compose.yml docker-compose.yml

git -C yi-chinese-manage pull --ff-only   # frontend (master)
git -C Learning          pull --ff-only   # backend  (main_2.0)

docker compose up -d --build              # or: ... --build web   /   --build api
docker image prune -f                     # reclaim old layers
```

> If `git pull` complains the branch is wrong, check it out first:
> `git -C yi-chinese-manage checkout master` / `git -C Learning checkout main_2.0`.

### A5. Verify

```bash
docker compose ps            # all "running"; db "healthy"
docker compose logs -f api   # watch for startup / DB-connection errors (Ctrl-C to exit)
docker compose logs -f web
```

Then from a browser (or `curl`) against `http://<EXTERNAL_IP>` (or your domain):

- `/learner` renders the frontend.
- `/api/...` returns JSON from Flask.
- Sign in — the session cookie should stick (same origin via nginx).
- Learn Together connects over `/socket.io`.

---

## Part B — Fix the auto-deploy (stale IP / secret)

The CI SSHes to `secrets.GCE_HOST`. When the VM's IP changes, update it. Do this so
the next push to a deploy branch works without the manual steps above.

### B1. Make the IP static (so it stops changing)

An ephemeral IP changes on every stop/start, which is what breaks CI. Reserve a
static IP and attach it to the VM (skip if it's already static):

```bash
gcloud compute addresses create yi-chinese-ip --region=<REGION>
gcloud compute addresses list        # note the reserved ADDRESS
# Attach it to the instance's NIC (Console: VM → Edit → Network interface →
# External IP → pick yi-chinese-ip), or via gcloud:
gcloud compute instances delete-access-config <INSTANCE> --zone=<ZONE> \
  --access-config-name="External NAT"
gcloud compute instances add-access-config <INSTANCE> --zone=<ZONE> \
  --access-config-name="External NAT" --address=<RESERVED_ADDRESS>
```

### B2. Confirm the deploy key still works

The old VM's `authorized_keys` is gone if the instance was recreated. On the VM,
make sure the CI deploy key's **public** half is present:

```bash
grep -c 'github-actions' ~/.ssh/authorized_keys   # expect >= 1
# If 0, append the public key (yi-deploy.pub) to ~/.ssh/authorized_keys.
```

If you no longer have the key pair, regenerate it and re-register (DEPLOY.md §5):

```bash
ssh-keygen -t ed25519 -f yi-deploy -C "github-actions"   # no passphrase
# append yi-deploy.pub to the VM's ~/.ssh/authorized_keys; keep yi-deploy (private) for B3
```

### B3. Update the GitHub Actions secrets

The frontend workflow lives in **tandiep48/yi-chinese-manage**
([`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml), triggers on
push to `master`). In **Settings → Secrets and variables → Actions**, set:

- `GCE_HOST` → the VM's **new static external IP**.
- `GCE_USER` → the SSH user that owns `/opt/yi-chinese` (unchanged unless the VM
  user changed).
- `GCE_SSH_KEY` → the **private** deploy key, only if you regenerated it in B2.

> The backend repo (**tandiep48/Learning**) has **no deploy workflow yet**, so
> pushing `main_2.0` does not auto-deploy `api` — you run `deploy.sh api` by hand
> (Part A). To automate it, add the workflow from DEPLOY.md §5 to that repo on
> `main_2.0` and give it the **same three secrets**.

### B4. Re-trigger and confirm

- Manually: the frontend workflow has `workflow_dispatch`, so in the repo's
  **Actions** tab run **"Deploy frontend to GCE"** once and watch it go green.
- Or push a commit to `master`.

A green run means CI SSHed in, pulled, and rebuilt `web` — auto-deploy is restored.

---

## Troubleshooting

- **`next build` killed / OOM on the VM.** The frontend build is memory-hungry.
  On a 2 GB machine add swap (DEPLOY.md §3) or use `e2-medium` (4 GB).
- **CI step "ssh: handshake failed" / timeout.** `GCE_HOST` is still wrong, the
  key isn't in `authorized_keys`, or port 22 is firewalled — recheck B1–B3.
- **Site loads but `/api` 502s.** `api` didn't come up — `docker compose logs api`;
  common causes are a bad `.env` (DB creds) or the `db` container not healthy yet.
- **Env change didn't take effect.** `NEXT_PUBLIC_*` are inlined at build time —
  rebuild `web` (`deploy.sh web`), a restart is not enough.
- **Pulled new code but nothing changed.** You restarted instead of rebuilding —
  always `docker compose up -d --build`, because the code is baked into the image.
