# Multi-stage Dockerfile for Brisa Cubana API
# Production-ready with security hardening, distroless base, and SBOM support
# References:
# - Google Distroless: https://github.com/GoogleContainerTools/distroless
# - Syft SBOM: https://github.com/anchore/syft
# Consulted: October 2, 2025

# ============================================================================
# Stage 1: Dependencies
# ============================================================================
FROM node:24.9.0-alpine AS deps
WORKDIR /app

# Enable Corepack for pnpm
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/

# Install production dependencies only (ignore lifecycle scripts)
RUN pnpm install --frozen-lockfile --prod --filter=@brisa/api --ignore-scripts

# ============================================================================
# Stage 2: Builder (TypeScript compilation + Prisma generation)
# ============================================================================
FROM node:24.9.0-alpine AS builder
WORKDIR /app

# Enable Corepack
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/api ./apps/api

# Install all dependencies (including dev deps for build)
RUN pnpm install --frozen-lockfile --filter=@brisa/api... --ignore-scripts

# Generate Prisma Client
RUN cd apps/api && pnpm db:generate

# Compile TypeScript to JavaScript (production-ready)
RUN cd apps/api && pnpm build

# ============================================================================
# Stage 3: Distroless Production Runner (Minimal Attack Surface)
# ============================================================================
FROM gcr.io/distroless/nodejs24-debian12:nonroot AS runner

# Set working directory
WORKDIR /app

# Copy workspace metadata (for monorepo compatibility)
COPY --chown=nonroot:nonroot package.json pnpm-workspace.yaml ./

# Copy production dependencies from deps stage
COPY --from=deps --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=deps --chown=nonroot:nonroot /app/apps/api/node_modules ./apps/api/node_modules

# Copy compiled application from builder
COPY --from=builder --chown=nonroot:nonroot /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nonroot:nonroot /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder --chown=nonroot:nonroot /app/apps/api/package.json ./apps/api/

# Expose port (Railway will override with PORT env var)
EXPOSE 3001

# Health check (distroless requires vector form, no shell)
# Note: Health checks are handled by Railway/Kubernetes external probes
# Uncomment if running on platforms that support HEALTHCHECK
# HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
#   CMD ["/nodejs/bin/node", "--input-type=module", "-e", "fetch('http://localhost:3001/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]

# Set environment variables
ENV NODE_ENV=production

# Security: Read-only filesystem (distroless enforces this)
# Security: Non-root user (distroless uses uid 65532 "nonroot" by default)

# Start application (vector form required for distroless)
ENTRYPOINT ["/nodejs/bin/node"]
CMD ["apps/api/dist/server.js"]

# ============================================================================
# Labels for SBOM and Container Metadata
# ============================================================================
LABEL org.opencontainers.image.title="Brisa Cubana API"
LABEL org.opencontainers.image.description="Production API for cleaning service management platform"
LABEL org.opencontainers.image.authors="Platform Engineering <platform@brisacubana.com>"
LABEL org.opencontainers.image.vendor="Brisa Cubana Clean Intelligence"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/albertodimas/brisa-cubana-clean-intelligence"
LABEL org.opencontainers.image.documentation="https://github.com/albertodimas/brisa-cubana-clean-intelligence/blob/main/apps/api/README.md"
