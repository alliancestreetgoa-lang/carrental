# ============================================================
# Alliance Car Rental — Backend Dockerfile
# Build context: apps/backend
# ============================================================

# ---- Stage 1: build ----------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first for layer caching
COPY package.json package-lock.json* ./

# Install all deps (including devDependencies for tsc + prisma CLI)
RUN npm install

# Copy Prisma schema before generate so the client is correct
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source and compile TypeScript
COPY . .
RUN npx tsc

# ---- Stage 2: runtime --------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy only production node_modules, compiled output, and prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

EXPOSE 4000

# Apply pending migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
