# Email Routing – Portal Cliente

> Última actualización: 5-nov-2025

## Objetivo

Recibir los correos del portal cliente (`cliente@brisacubanacleanintelligence.com`) sin desplegar un servidor propio, reenviándolos a la casilla operativa del equipo.

## Proveedor

- **ImprovMX (plan gratuito)** – Únicamente reenvío.

## Registros DNS en Vercel

```bash
vercel dns add brisacubanacleanintelligence.com @ MX mx1.improvmx.com --priority 10
vercel dns add brisacubanacleanintelligence.com @ MX mx2.improvmx.com --priority 20
vercel dns add brisacubanacleanintelligence.com @ TXT "v=spf1 include:spf.improvmx.com ~all"
```

> Nota: Los registros SendGrid (DKIM, `_dmarc`, etc.) permanecen sin cambios.

## Alias configurados

| Alias                                      | Reenvía a                                                   | Uso                           |
| ------------------------------------------ | ----------------------------------------------------------- | ----------------------------- |
| `cliente@brisacubanacleanintelligence.com` | `operaciones@brisacubanacleanintelligence.com` (alias real) | Smoke test de enlaces mágicos |

## Procedimiento de verificación

1. Crear/editar alias en **ImprovMX → Email Forwarding**.
2. Esperar propagación DNS (`dig MX brisacubanacleanintelligence.com`).
3. Ejecutar smoke:
   ```bash
   curl -i -X POST https://api.brisacubanacleanintelligence.com/api/portal/auth/request \
     -H 'Content-Type: application/json' \
     -d '{"email":"cliente@brisacubanacleanintelligence.com"}'
   ```
4. Confirmar en:
   - **SendGrid → Activity** → estado `Delivered`.
   - Casilla operativa → correo recibido con el enlace mágico.

## Rotación / fallback

- Si se cambia de proveedor, documentar aquí los nuevos registros MX/TXT.
- Mantener al menos un alias de respaldo apuntando a un correo monitoreado (ej.: `soporte@`).
