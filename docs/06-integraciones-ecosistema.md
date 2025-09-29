# 06 · Integraciones y Ecosistema

## Núcleo MVP
| Partner | Uso | Scopes/credenciales | Checklist sandbox | Prioridad |
|---------|-----|---------------------|-------------------|-----------|
| **Stripe** | Pagos, payouts, facturas | Dashboard → claves secret/public, webhook endpoint firmado | Activar modo test, crear productos y cuentas conectadas, webhook → Worker | P0 |
| **Twilio / WhatsApp** | SMS/WhatsApp, IVR | SID + Auth Token, template IDs, Business Manager | Verificar número, registrar plantillas ES/EN, probar opt-in/out | P0 |
| **SendGrid / Resend** | Correo transaccional | API key con permisos `mail.send` | Configurar dominio DKIM, pruebas smoke con plantillas | P1 |
| **Google Maps Platform** | Geocoding, rutas | API key restringida por IP/Referer | Habilitar Geocoding, Directions, Distance Matrix, alertas de quota | P0 |
| **QuickBooks Online** | Contabilidad, reporting | OAuth client ID/secret, realm ID | Crear sandbox company, mapear chart of accounts, tests sync | P1 |
| **DocuSign** | Contratos B2B | Integrator key + secret, cuenta sandbox | Configurar plantilla multilingüe, webhook Connect, prueba firma | P1 |
| **Auth provider** (Clerk/Auth0) | Passkeys/WebAuthn, SSO | Tenant ID, API keys, JWKS | Habilitar WebAuthn + MFA, sync roles RBAC, flujo invitaciones | P0 |
| **Intercom / Front** | Soporte omnicanal | Access token, webhook secret | Crear inbox beta, flow de escalamiento, sync tags con CRM | P2 |

## Expansión 3-6 meses
- PMS/Channel managers: Airbnb, Vrbo, Hostaway, Guesty, Lodgify.
- PropTech: AppFolio, Buildium, Yardi.
- Hotels: Cloudbeds, Oracle Opera.
- Marketing: Meta Ads, Google Ads, TikTok, HubSpot CRM.
- IoT: Cerraduras inteligentes (August, Schlage), termostatos (Nest/Ecobee), sensores BLE.
- Contabilidad avanzada: NetSuite, Xero.
- Background checks: Checkr.

### Prioridad PMS
| Partner | Criterios | Notas |
|---------|----------|-------|
| **Hostaway** | API madura, >100k listings, soporte Miami | Ideal para pilotos con property managers locales. |
| **Guesty** | Penetración high-end + automatización avanzada | Coordinar fees y acceso sandbox temprano. |
| **Airbnb API (via partner)** | Acceso limitado, requiere aprobación | Preparar aplicación con casos de uso CleanScore. |
| **Lodgify** | SMB/independientes, API REST sencilla | Buen fit para hosts boutique; baja barrera. |
| **Vrbo** | Mercado relevante pero acceso más restrictivo | Abordar cuando volumen >200 propiedades. |

## Futuro (6-12 meses)
- Developer portal y API publica.
- Integraciones ESG (Watershed, Persefoni).
- Sistemas fiscales / payroll.
- Programas de fidelización (Gift Up!, LoyaltyLion).

## Patrón técnico
1. **Ingestores edge** → Cloudflare Workers/Netlify Edge reciben webhook/stream y publican en Event Mesh.
2. **Normalización** → servicios Bun transforman payloads a eventos internos (JSON schema).
3. **Temporal** orquesta lógica (validación, idempotencia, reintentos).
4. **Storage** → Postgres + warehouse + lake.
5. **Observabilidad** → logs/traces por partner, panel de estado.
6. **Seguridad** → Secrets en vault, rotación automática, rate limit, firma de webhooks.

## Requisitos legales/comerciales
- Stripe: KYC, vinculación bancaria, términos anti-fraude.
- Twilio: verificación, cartas de autorización, cumplimiento WhatsApp Business.
- Google Maps: términos de uso, sin cache permanente de data.
- QuickBooks: limitaciones API (quota), contabilidad GAAP.
- PMS/PropTech: contratos, acceso sandbox, posibles fees.
- IoT: asegurar cifrados, protección de credenciales.

## Checklist sandbox & secretos
| Partner | Pasos sandbox | Secretos a crear | Evidencia |
|---------|---------------|------------------|-----------|
| Stripe | Crear cuenta → modo test → productos/prices → webhook signing secret | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Ejecutar eventos test en Postman/Pact |
| Twilio/WhatsApp | Verificar número, registrar plantillas ES/EN, probar opt-in/out | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER` | Captura mensaje demo |
| Clerk/Auth0 | Crear tenant, habilitar passkeys/MFA, flujos invitación | `AUTH_ISSUER`, `AUTH_CLIENT_ID`, `AUTH_CLIENT_SECRET` | Login demo documentado |
| QuickBooks | Sandbox company, app OAuth, scopes `com.intuit.quickbooks.accounting` | `QBO_CLIENT_ID`, `QBO_CLIENT_SECRET`, `QBO_REALM_ID`, `QBO_REDIRECT_URI` | Factura/sync test |
| DocuSign | Activar developer account, plantilla multilingüe, Connect | `DOCUSIGN_CLIENT_ID`, `DOCUSIGN_CLIENT_SECRET`, `DOCUSIGN_ACCOUNT_ID`, `DOCUSIGN_WEBHOOK_SECRET` | Sobre firmado modo demo |
| SendGrid/Resend | Configurar dominio DKIM/SPF, plantilla correo | `SENDGRID_API_KEY` / `RESEND_API_KEY` | Email prueba deliverability |

> Guardar secretos en 1Password (equipo) y duplicarlos en AWS/Azure Secret Manager para staging/prod. Mantener checklist viva en `infra/secrets/README.md`.

## Integraciones internas
- **Digital twin** ↔ datos contables (QuickBooks) y operativos (Temporal). 
- **Knowledge graph** ↔ CRM, feedback, training.
- **AI autopilot** ↔ marketing APIs, reputación, pricing.
- **Compliance bot** ↔ calendarios, documentación, notificaciones.
