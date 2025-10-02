# Multi-stage Dockerfile for Brisa Cubana Web (Next.js)
# Production-ready with security hardening, distroless base, and SBOM support
# References:
# - Next.js Docker: https://nextjs.org/docs/app/building-your-application/deploying/production
# - Google Distroless: https://github.com/GoogleContainerTools/distroless
# Consulted: October 2, 2025

# ============================================================================
# Stage 1: Dependencies
# ============================================================================
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

# Install dependencies (production + dev for build)
RUN pnpm install --frozen-lockfile --filter=web...

# ============================================================================
# Stage 2: Builder
# ============================================================================
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

# Build Next.js app (standalone output for minimal runtime)
RUN cd apps/web && pnpm build

# ============================================================================
# Stage 3: Distroless Production Runner (Minimal Attack Surface)
# ============================================================================
FROM gcr.io/distroless/nodejs24-debian12:nonroot AS runner

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy standalone Next.js output (self-contained with required node_modules)
COPY --from=builder --chown=nonroot:nonroot /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nonroot:nonroot /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nonroot:nonroot /app/apps/web/public ./apps/web/public

# Expose port (Vercel/Railway will override with PORT env var)
EXPOSE 3000

# Health check (distroless requires vector form, no shell)
# Note: External health checks handled by platform (Vercel/Railway)
# Uncomment if running on platforms that support HEALTHCHECK
# HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
#   CMD ["/nodejs/bin/node", "-e", "require('http').get('http://localhost:3000/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"]

# Security: Read-only filesystem (distroless enforces this)
# Security: Non-root user (distroless uses uid 65532 "nonroot" by default)

# Start Next.js server (vector form required for distroless)
ENTRYPOINT ["/nodejs/bin/node"]
CMD ["apps/web/server.js"]

# ============================================================================
# Labels for SBOM and Container Metadata
# ============================================================================
LABEL org.opencontainers.image.title="Brisa Cubana Web"
LABEL org.opencontainers.image.description="Next.js web application for cleaning service management"
LABEL org.opencontainers.image.authors="Platform Engineering <platform@brisacubana.com>"
LABEL org.opencontainers.image.vendor="Brisa Cubana Clean Intelligence"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/albertodimas/brisa-cubana-clean-intelligence"
LABEL org.opencontainers.image.documentation="https://github.com/albertodimas/brisa-cubana-clean-intelligence/blob/main/apps/web/README.md"
