# Brisa Cubana Clean Intelligence — Documentation Hub

Welcome to the **Brisa Cubana Clean Intelligence** documentation center. Here you'll find everything needed to understand, build, and operate the intelligent cleaning platform for Miami-Dade.

---

## 👨‍💻 For Developers

**Technical documentation for building, testing, and deploying.**

- **[Quickstart (5 min)](for-developers/quickstart.md)** - Get up and running
- **[API Reference](for-developers/api-reference.md)** - 23 REST endpoints documented
- **[Testing Guide](for-developers/testing.md)** - Vitest + Playwright
- **[Deployment Guide](for-developers/deployment.md)** - Vercel/Railway/Fly.io

[📚 Browse all developer docs →](for-developers/)

---

## 💼 For Business & Operations

**Strategic planning, market analysis, and operational guides.**

- **[Vision & Strategy](for-business/vision-strategy.md)** - Mission, OKRs, roadmap
- **[Market & Compliance](for-business/market-compliance.md)** - Miami-Dade analysis
- **[AI & Automation](for-business/ai-automation.md)** - AI strategy and governance
- **[Roadmap](for-business/roadmap.md)** - Product roadmap and operations
- **[SOPs](for-business/operations/sops/)** - Standard Operating Procedures

[📊 Browse all business docs →](for-business/)

---

## 🎓 Guides & Tutorials

**Step-by-step tutorials for common tasks.**

_Coming soon_

[📖 Browse guides →](guides/)

---

## 📚 Reference

**Templates, specs, and reference materials.**

- [ADR Template](reference/templates/adr-template.md)
- [Model Card Template](reference/templates/model-card-template.md)
- [Sources & Bibliography](reference/sources.md)

[🗂️ Browse reference materials →](reference/)

---

## 🚀 Quick Start

### For Developers

```bash
# 1. Clone repo
git clone git@github.com:albertodimas/brisa-cubana-clean-intelligence.git
cd brisa-cubana-clean-intelligence

# 2. Install dependencies
pnpm install

# 3. Setup environment
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local

# 4. Start services
docker compose up -d
pnpm db:setup

# 5. Run development servers
pnpm dev
```

See [Quickstart Guide](for-developers/quickstart.md) for detailed instructions.

### For Documentation Contributors

```bash
# Install MkDocs
pip install -r requirements.txt

# Start local server
mkdocs serve
# → http://localhost:8000

# Build static site
mkdocs build
```

---

## 📦 Project Structure

```
brisa-cubana-clean-intelligence/
├── apps/
│   ├── api/          # Hono backend (Node.js 24)
│   └── web/          # Next.js 15 frontend
├── packages/
│   └── ui/           # Shared design system
├── docs/             # Documentation (you are here)
│   ├── for-developers/
│   ├── for-business/
│   ├── guides/
│   └── reference/
└── scripts/          # Automation scripts
```

---

## 📊 Project Status

| Area                | Status                                        |
| ------------------- | --------------------------------------------- |
| **MVP Backend**     | ✅ Complete (23 endpoints, 66 tests)          |
| **MVP Frontend**    | ✅ Complete (dashboard, bookings, properties) |
| **Documentation**   | ✅ Complete (78 MD files)                     |
| **Testing**         | ✅ Unit + Integration + E2E configured        |
| **CI/CD**           | ✅ GitHub Actions (5 workflows)               |
| **Deployment**      | 🔄 Staging ready, prod planned                |
| **CleanScore™ AI** | 🔜 Roadmap (MVP in development)               |
| **Concierge AI**    | 🔜 Roadmap                                    |

---

## 🔗 External Links

- **GitHub Repository**: [albertodimas/brisa-cubana-clean-intelligence](https://github.com/albertodimas/brisa-cubana-clean-intelligence)
- **API Docs** (when deployed): `https://api.brisacubana.com/docs`
- **Staging**: `https://brisa-cubana-staging.vercel.app`

---

## 📝 Documentation Info

- **Last Updated**: September 30, 2025
- **Stack**: MkDocs + Material theme
- **Search**: Enabled with highlighting
- **Dark Mode**: Available via theme toggle
- **Versioning**: Git-tracked, use PRs for changes

---

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for:

- Development workflow
- Commit conventions
- Testing guidelines
- Code review process

---

**Questions?** Open an issue on [GitHub](https://github.com/albertodimas/brisa-cubana-clean-intelligence/issues) or contact: albertodimasmorazaldivar@gmail.com
