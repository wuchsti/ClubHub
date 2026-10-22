# Multi-stage build for self-hosting ClubHub (e.g. on netcup) behind your
# own reverse proxy. Not required/used on Vercel (zero-config there).
#
# NOT built or run in the CI/sandbox that produced this file - no Docker
# daemon was available there. Verify locally with:
#   docker build -t clubhub .
#   docker run -p 3000:3000 --env-file .env.local clubhub
# before relying on it in production.

FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build-time placeholders: nothing here is called at build time (every page
# that touches Supabase/Stripe renders dynamically), but the modules read
# these env vars at import/module scope, so the build needs *something*.
ENV NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
