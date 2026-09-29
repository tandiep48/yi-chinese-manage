#!/usr/bin/env bash
# Server-side deploy for the Yi Chinese stack on Google Cloud Compute Engine.
# Pulls the latest code, rebuilds the affected image(s) and restarts them.
# Invoked over SSH by GitHub Actions, or run by hand:  deploy.sh [all|web|api]
set -euo pipefail

ROOT="/opt/yi-chinese"
WEB_DIR="$ROOT/yi-chinese-manage"
API_DIR="$ROOT/Learning"

component="${1:-all}"   # all | web | api

# Run from the project root so ./yi-chinese-manage, ./Learning and ./.env resolve.
cd "$ROOT"
# Keep the running compose file in sync with the repo's version.
cp "$WEB_DIR/deploy/docker-compose.yml" "$ROOT/docker-compose.yml"

case "$component" in
  web)
    git -C "$WEB_DIR" pull --ff-only
    docker compose up -d --build web
    ;;
  api)
    git -C "$API_DIR" pull --ff-only
    docker compose up -d --build api
    ;;
  all)
    git -C "$WEB_DIR" pull --ff-only
    git -C "$API_DIR" pull --ff-only
    docker compose up -d --build
    ;;
  *)
    echo "usage: deploy.sh [all|web|api]" >&2
    exit 1
    ;;
esac

# Reclaim disk from the previous image layers.
docker image prune -f
