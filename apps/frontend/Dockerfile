# ============================================================
# Alliance Car Rental — Frontend Dockerfile (Next.js standalone)
# Build context: apps/frontend
#
# IMPORTANT: NEXT_PUBLIC_* variables are inlined at BUILD TIME.
# Pass them as --build-arg / ARG / ENV before `npm run build`.
# Changing them after the image is built has no effect —
# you must rebuild the image.
# ============================================================

# ---- Stage 1: build ----------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Declare build-time public env vars
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_SITE_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Stage 2: runtime (Next standalone output) -------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Standalone server bundle
COPY --from=builder /app/.next/standalone ./
# Static assets served by the standalone server
COPY --from=builder /app/.next/static ./.next/static
# Public assets (images, fonts, etc.)
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
