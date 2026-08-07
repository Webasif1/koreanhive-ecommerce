# syntax=docker/dockerfile:1.7

# Korean Hive — production image.
#
# Build (BuildKit required, which is the default in modern Docker):
#   docker build \
#     --secret id=mongodb_uri,env=MONGODB_URI \
#     --build-arg NEXT_PUBLIC_SITE_URL=https://koreanhive.com \
#     -t koreanhive .
#
# The database URI is a build *secret*, not a build arg: six routes are
# prerendered by `next build` and query MongoDB, so the build genuinely needs
# a reachable database — but a --build-arg would be visible forever in
# `docker history`. A secret mount exists only for the RUN that uses it.

ARG NODE_VERSION=24-alpine

# ---------------------------------------------------------------- deps
FROM node:${NODE_VERSION} AS deps
# sharp (used by next/image) links against glibc shims on Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# -------------------------------------------------------------- builder
FROM node:${NODE_VERSION} AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Inlined into the client bundle at build time, so it cannot be deferred to
# runtime like the other environment variables.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# next/image serves from public/; create it so the COPY below never fails
# on a project that has not added static assets yet.
RUN mkdir -p public

RUN --mount=type=secret,id=mongodb_uri \
    MONGODB_URI="$(cat /run/secrets/mongodb_uri 2>/dev/null || echo '')" \
    npm run build

# -------------------------------------------------------------- runner
FROM node:${NODE_VERSION} AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# bind to every interface: localhost-only would be unreachable from outside
# the container
ENV HOSTNAME=0.0.0.0

# Run as an unprivileged user rather than root.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# /api/health is force-dynamic and touches no database, so it reports the
# server being up without failing when Mongo is briefly unreachable.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
