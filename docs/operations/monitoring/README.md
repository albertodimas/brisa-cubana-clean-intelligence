# Monitoreo y Observabilidad

Documentación de Sentry para error tracking y performance monitoring.

## 📚 Documentación Disponible

### [SENTRY_SETUP.md](SENTRY_SETUP.md)

Guía completa de configuración (3000+ palabras)

**Contenido:**

- Arquitectura de Sentry en API (Node.js) y Web (Next.js)
- Configuración de Session Replay
- Profiling y performance monitoring
- PII sanitization
- Custom error boundaries
- Integración con Prisma
- Troubleshooting

**Audiencia:** DevOps, Backend/Frontend Developers

### [SENTRY_QUICKSTART.md](SENTRY_QUICKSTART.md)

Activación en 5 minutos

**Pasos:**

1. Crear proyecto en sentry.io
2. Obtener DSN
3. Configurar secrets (Railway + Vercel)
4. Desplegar
5. Verificar con test endpoints

**Audiencia:** Todos

### [SENTRY_MIGRATION.md](SENTRY_MIGRATION.md)

Migración y troubleshooting

**Contenido:**

- Checklist de migración
- Rollback plan
- Common issues
- Testing procedures

**Audiencia:** DevOps, Tech Leads

## 🚀 Quick Start

```bash
# 1. Obtener DSN de sentry.io
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"

# 2. Configurar en Railway (API)
railway variables set SENTRY_DSN="$SENTRY_DSN"
railway variables set SENTRY_ENVIRONMENT="production"

# 3. Configurar en Vercel (Web)
vercel env add NEXT_PUBLIC_SENTRY_DSN production
vercel env add NEXT_PUBLIC_SENTRY_ENVIRONMENT production

# 4. Desplegar
railway up
vercel --prod

# 5. Probar
curl https://api.brisacubanaclean.com/api/sentry/test-capture
```

## 📊 Cobertura Actual

| Componente     | Estado         | Features                                      |
| -------------- | -------------- | --------------------------------------------- |
| **API**        | ✅ Configurado | Error tracking, Profiling, Prisma integration |
| **Web**        | ✅ Configurado | Session Replay, Error boundary, Profiling     |
| **Activation** | 🟡 Pendiente   | Needs DSN + Auth Token                        |

## 🔗 Enlaces

- [Sentry Documentation](https://docs.sentry.io/)
- [Next.js Integration](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Node.js Integration](https://docs.sentry.io/platforms/node/)
- [Profiling Guide](https://docs.sentry.io/product/profiling/)

## 📞 Soporte

- **Configuración:** Ver SENTRY_SETUP.md
- **Problemas:** Ver SENTRY_MIGRATION.md sección Troubleshooting
- **Test Endpoints:** `GET /api/sentry/*` (solo dev/staging)
