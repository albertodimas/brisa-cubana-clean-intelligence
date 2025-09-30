# Multi-stage Dockerfile for Brisa Cubana Web (Next.js)
# Optimized for production with standalone output

# Stage 1: Dependencies
FROM node:24.9.0-alpine AS deps
WORKDIR /app

# Enable Corepack for pnpm
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

# Install libc6-compat for compatibility
RUN apk add --no-cache libc6-compat

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter=web...

# Stage 2: Builder
FROM node:24.9.0-alpine AS builder
WORKDIR /app

# Enable Corepack
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/web ./apps/web
COPY packages/ui ./packages/ui

# Install dependencies
RUN pnpm install --frozen-lockfile --filter=web...

# Build UI package first
RUN cd packages/ui && pnpm build

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js app
RUN cd apps/web && pnpm build

# Stage 3: Production runner
FROM node:24.9.0-alpine AS runner
WORKDIR /app

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))" || exit 1

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/web/server.js"]
