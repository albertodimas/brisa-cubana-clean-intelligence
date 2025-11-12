# Security Policy

## Reportar vulnerabilidades

- **Correo primario:** seguridad@brisacubanacleanintelligence.com
- **Alternativa:** abrir un reporte privado en GitHub Security Advisories (Security → Report a vulnerability).
- **Clave PGP (opcional):** solicitar fingerprint en el correo primario para intercambio cifrado.

> Consulta también [`docs/operations/security.md`](docs/operations/security.md) para el hardening operativo (variables obligatorias, rotación de secrets, procedimientos de despliegue seguro).

## Alcance

- API (`apps/api`) desplegada en Vercel / Render.
- Frontend (`apps/web`) en Vercel.
- Scripts y pipelines CI (GitHub Actions, Playwright, Prisma).

Los entornos de clientes y cualquier servicio de terceros fuera de este repositorio quedan fuera del alcance de este programa.

## Acuse y tiempos de respuesta

| Acción                      | Tiempo objetivo                                                  |
| --------------------------- | ---------------------------------------------------------------- |
| Acuse de recibo inicial     | ≤ 2 días hábiles                                                 |
| Evaluación y clasificación  | ≤ 5 días hábiles                                                 |
| Plan de mitigación o parche | ≤ 10 días hábiles (críticos); ≤ 20 días hábiles (baja severidad) |

## Expectativas

- **Investigadores:** evitar pruebas que degraden el servicio, respetar datos personales y no divulgar detalles antes de que el parche esté disponible (coordinated disclosure).
- **Equipo Brisa:** mantener informada a la persona que reporta el hallazgo, reconocer su contribución (salvo solicitud en contrario) y publicar notas en el CHANGELOG una vez desplegada la corrección.

Gracias por ayudarnos a mantener Brisa OS (Brisa Cubana Clean Intelligence) segura para toda la comunidad.
