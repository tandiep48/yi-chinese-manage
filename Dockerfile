# syntax=docker/dockerfile:1
# Next.js (standalone) image for the Yi Chinese frontend.
# Built by deploy/docker-compose.yml on the ECS VM. See DEPLOY.md.

# ── deps ─ install node_modules against the lockfile only ─────────────────────
FROM node:22-alpine AS deps
# Next's standalone server needs the gcompat shim on Alpine (glibc → musl).
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ── builder ─ compile the app ────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* are inlined into the client bundle at build time, so they must be
# present for `next build`, not just at runtime. docker-compose passes them as
# build ARGs (declared here).
#   - API URL empty ⇒ the client calls same-origin "/api" and "/socket.io", which
#     nginx routes to the api container (no CORS, no cross-site cookies).
ARG NEXT_PUBLIC_API_URL=""
ARG NEXT_PUBLIC_GCS_BUCKET_URL=""
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_GCS_BUCKET_URL=${NEXT_PUBLIC_GCS_BUCKET_URL}
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── runner ─ minimal runtime image ───────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Next listens on PORT; nginx proxies to it on the docker network.
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# The standalone build already contains a trimmed node_modules + server.js; the
# static assets and public/ are copied alongside it as Next expects.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
