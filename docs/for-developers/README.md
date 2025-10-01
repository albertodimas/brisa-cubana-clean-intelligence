# Developer Documentation

Technical documentation for building, testing, and deploying Brisa Cubana Clean Intelligence.

## 🚀 Getting Started

- **[Quickstart Guide](quickstart.md)** - Get up and running in 5 minutes
- **[API Reference](api-reference.md)** - Complete API endpoint documentation (23 endpoints)
- **[Testing Guide](testing.md)** - Unit tests (Vitest) + E2E tests (Playwright)
- **[Deployment Guide](deployment.md)** - Deploy to staging/production

## 📂 Documentation Index

### Core Documentation

- [Quickstart](quickstart.md) - 5-minute setup guide
- [API Reference](api-reference.md) - REST API endpoints
- [Testing](testing.md) - Testing strategies and examples
- [Deployment](deployment.md) - Deployment to Vercel/Railway/Fly.io

### Advanced Topics

- [GitHub Secrets](github-secrets.md) - CI/CD secrets configuration
- [Staging Setup](staging-setup.md) - Staging environment setup

### Architecture & Design

- [Diagrams](diagrams/) - C4 diagrams, flowcharts, sequences
- [Design System](design-system/) - UI component library docs
- [AI & ML](ai-ml/) - Model cards, AI governance

### Tools & Integrations

- [Copilot](copilot/) - AI-assisted development policies

## 🛠️ Quick Commands

```bash
# Development
pnpm dev              # Start all services
pnpm dev:web          # Frontend only
pnpm dev:api          # Backend only

# Testing
pnpm test             # Run all tests
pnpm test:e2e         # E2E tests
pnpm test:coverage    # Coverage report

# Database
pnpm db:studio        # Prisma Studio
pnpm db:seed          # Seed data
pnpm db:push          # Sync schema

# Quality
pnpm lint             # Lint all
pnpm typecheck        # TypeScript check
pnpm format           # Format code
```

## 📚 Related Documentation

- [Business Documentation](../for-business/) - Vision, market, operations
- [Templates](../reference/templates/) - Reusable templates
- [Guides](../guides/) - Step-by-step tutorials

## 🤝 Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development workflow and code standards.

---

**Last Updated:** September 30, 2025
