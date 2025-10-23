# Mapa de Dominios e Integraciones

**Última actualización:** 23 de octubre de 2025  
Esta guía resume los dominios activos del proyecto y los subdominios planeados para escalabilidad futura. Úsala al coordinar DNS, certificados y variables de entorno en Vercel.

## 1. Dominios activos

| Dominio                                | Servicio / Uso                          | Estado    | Notas                                                                          |
| -------------------------------------- | --------------------------------------- | --------- | ------------------------------------------------------------------------------ |
| `brisacubanacleanintelligence.com`     | Marketing site + portal cliente + panel | ✅ Activo | Aliased a `brisa-cubana-clean-intelligence-np54jzbn1-brisa-cubana.vercel.app`. |
| `www.brisacubanacleanintelligence.com` | Redirección 301 al dominio raíz         | ✅ Activo | Configurado en `apps/web/vercel.json`.                                         |
| `api.brisacubanacleanintelligence.com` | API Hono (apps/api)                     | ✅ Activo | Alias a `brisa-cubana-clean-intelligence-mpcjiihms-brisa-cubana.vercel.app`.   |

## 2. Subdominios reservados / futuros

| Subdominio                                | Propósito propuesto                          | Status       | Pasos siguientes                                                                    |
| ----------------------------------------- | -------------------------------------------- | ------------ | ----------------------------------------------------------------------------------- |
| `status.brisacubanacleanintelligence.com` | Status page automatizado (UptimeRobot / etc) | 📝 Pendiente | Crear proyecto/servicio y añadir CNAME en Vercel DNS cuando se defina proveedor.    |
| `docs.brisacubanacleanintelligence.com`   | Documentación pública / knowledge base       | 📝 Pendiente | Reservado para futuro despliegue (ej. Nextra, Mintlify).                            |
| `app.brisacubanacleanintelligence.com`    | Separar panel/portal del marketing site      | 📝 Pendiente | Solo necesario si se despliega un frontend dedicado distinto a `apps/web`.          |
| `cdn.brisacubanacleanintelligence.com`    | CDN/Assets estáticos                         | 📝 Pendiente | Evaluar si es necesario cuando se sirvan archivos pesados o integraciones externas. |

> _Nota:_ no crear registros DNS sin un proyecto o servicio definido. Mantener esta tabla sincronizada cuando se agreguen nuevos subdominios.

## 3. Handles sociales oficiales

| Plataforma | URL                                                       | Uso                                         |
| ---------- | --------------------------------------------------------- | ------------------------------------------- |
| Instagram  | https://instagram.com/BrisaCleanIntelligence              | Historias, reels y backstage 24/7.          |
| Facebook   | https://facebook.com/BrisaCleanIntelligence               | Casos completos, reseñas y anuncios.        |
| LinkedIn   | https://www.linkedin.com/company/brisa-clean-intelligence | Insights operativos, alianzas y talento.    |
| TikTok     | https://www.tiktok.com/@brisacleanintelligence            | Timelapses, tips y retos premium.           |
| YouTube    | https://www.youtube.com/@BrisaCleanIntelligence           | Recorridos, testimonios extendidos y guías. |

> Mantén estos enlaces visibles en landing, metadata y materiales comerciales. Actualiza si se crean subdominios adicionales que requieran crosslink.

## 4. Variables de entorno clave (Vercel)

Configurar los valores siguientes (Development / Preview / Production) con los dominios definitivos:

| Variable                                                   | Valor producción                                  | Paquete(s) |
| ---------------------------------------------------------- | ------------------------------------------------- | ---------- |
| `NEXT_PUBLIC_BASE_URL`                                     | `https://brisacubanacleanintelligence.com`        | web        |
| `NEXTAUTH_URL`                                             | `https://brisacubanacleanintelligence.com`        | web        |
| `NEXT_PUBLIC_SITE_URL`                                     | `https://brisacubanacleanintelligence.com`        | web        |
| `NEXT_PUBLIC_API_URL`                                      | `https://api.brisacubanacleanintelligence.com`    | web        |
| `INTERNAL_API_URL`                                         | `https://api.brisacubanacleanintelligence.com`    | web        |
| `PORTAL_MAGIC_LINK_BASE_URL`                               | `https://brisacubanacleanintelligence.com`        | api        |
| `SLACK_WEBHOOK_URL`                                        | URL del webhook Slack (canal #alerts-operaciones) | web        |
| `LEAD_WEBHOOK_URL`                                         | URL del CRM/automation para leads                 | web        |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` | Claves Stripe modo live                           | web, api   |

## 5. Checklist de despliegue por dominio

1. **Alias en Vercel**: `vercel alias set <deployment> <dominio>`.
2. **Certificados**: Vercel emite Let’s Encrypt automáticamente; verificar en Dashboard → Domains.
3. **HSTS**: activado por defecto (`Strict-Transport-Security` en `apps/web/next.config.ts`). Confirmar cargas via `curl -I`.
4. **Integraciones externas**: actualizar dashboards de Sentry, PostHog, Stripe y cualquier proveedor que valide la lista de dominios.
5. **Documentación**: actualizar esta tabla y `docs/operations/deployment.md` cuando se agreguen o modifiquen subdominios.

## 6. Tareas pendientes

- [ ] Definir proveedor para `status.*` y `docs.*`.
- [x] Configurar `SLACK_WEBHOOK_URL`, `LEAD_WEBHOOK_URL` y credenciales Stripe live (ver [env-sync.md](env-sync.md)). _Actualizado 21-oct-2025; revisar al rotar claves._
- [ ] Añadir prueba automatizada de validación de dominios (curl/uptime) a los pipelines nightly.

Asegúrate de revisar esta guía antes de crear nuevos entornos o compartir URLs con clientes. Mantener una fuente única de verdad evita inconsistencias entre DNS, certificados y variables de entorno.
