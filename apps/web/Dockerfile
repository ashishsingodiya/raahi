# ============================================
# Stage 1: Base
# ============================================
FROM node:24-slim AS base

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@12.15.0 --activate
RUN apt-get update && apt-get install -y --no-install-recommends libc6 && rm -rf /var/lib/apt/lists/*

# ============================================
# Stage 2: Prepare — turbo prune
# ============================================
FROM base AS prepare

RUN pnpm add -g turbo@^2

# Copy entire monorepo (filtered by .dockerignore)
COPY . .

# Generate a pruned monorepo for @ridemate/web
RUN turbo prune @ridemate/web --docker

# ============================================
# Stage 3: Builder — install deps & build
# ============================================
FROM base AS builder

# Required build arg — build fails if missing
ARG NEXT_PUBLIC_APP_URL
RUN test -n "$NEXT_PUBLIC_APP_URL" || (echo "ERROR: NEXT_PUBLIC_APP_URL build arg is required!" && exit 1)
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Skip server-side env validation (POSTGRES_URL etc. are runtime-only)
ENV SKIP_ENV_VALIDATION=1
ENV CI=true
ENV NODE_ENV=production

# Copy pruned package.json files + lockfile first (for Docker layer caching)
COPY --from=prepare /app/out/json/ .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy pruned source code
COPY --from=prepare /app/out/full/ .

# Build the Next.js app
RUN pnpm turbo run build --filter=@ridemate/web...

# ============================================
# Stage 4: Runner — minimal production image
# ============================================
FROM node:24-slim AS runner

WORKDIR /app

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Set correct permissions for prerender cache
RUN mkdir -p apps/web/.next
RUN chown nextjs:nodejs apps/web/.next

# Copy standalone output + static files
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

CMD ["node", "apps/web/server.js"]