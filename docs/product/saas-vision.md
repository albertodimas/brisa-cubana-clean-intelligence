# Brisa OS · Visión SaaS

## 1. Contexto

- **Estado actual**: El repositorio contiene la infraestructura completa (landing, portal Next.js, API Hono, CI/CD en Vercel) pensada originalmente para operar la empresa de limpieza “Brisa Cubana”.
- **Nuevo objetivo**: Convertir ese stack en un **software as a service** que cualquier empresa de limpieza/turnovers pueda usar para digitalizar su operación, sin necesidad de construir tecnología propia.
- **Equipo**: Actualmente solo participamos dos personas, por lo que la documentación debe ser la única “fuente de verdad” y cada cambio debe quedar registrado aquí antes de tocar otros archivos.

## 2. Cliente ideal

| Segmento    | Características                                                    | Dolor                                                                     |
| ----------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| **Starter** | Empresas pequeñas (1‑5 propiedades) que operan por WhatsApp/Excel. | No tienen forma de mostrar evidencia profesional a sus clientes.          |
| **Growth**  | Operadores medianos (5‑25 propiedades) con múltiples cuadrillas.   | Falta de visibilidad, inventario desordenado, SLA incumplidos.            |
| **Scale**   | Empresas grandes (25+ propiedades, varias marcas o ciudades).      | Necesitan portal white‑label, integraciones PMS/CRM y reportes avanzados. |

## 3. Problemas que resolvemos

1. **Evidencia dispersa**: Fotos, checklists y notas viven en chats o papeles → no se puede demostrar calidad.
2. **Clientes ciegos**: Los property managers exigen ver qué se hizo y recibir alertas en tiempo real.
3. **Operación manual**: Calendarios, inventario y tickets se manejan a mano → errores, retrabajo y cero escalabilidad.
4. **Falta de diferenciación**: Empresas no tienen un portal ni procesos hoteleros que justifiquen un precio premium.

## 4. Propuesta de valor

> “Brisa OS es el sistema operativo para empresas de limpieza premium: checklists hoteleros, evidencia automática y portal cliente white‑label en un software asequible.”

- **Checklists premium + IA**: Plantillas listas (turnover, deep clean, staging) con fotos, firmas y resúmenes automáticos.
- **Portal cliente**: Timeline, incidencias y aprobaciones en un portal que la empresa puede personalizar con su marca.
- **Control operativo**: Calendario, asignación de cuadrillas, inventario/restocks y tickets en un solo lugar.
- **Integraciones + alertas**: PMS (Guesty, Hostaway…), Slack, WhatsApp Business, correo, webhooks.
- **Onboarding guiado**: Wizard, tutoriales cortos, soporte humano y plantillas preconfiguradas.

## 5. Diferenciadores

1. **Playbooks reales**: Basados en 12K+ servicios reales; entregamos procesos hoteles “listos”.
2. **Evidencia profesional**: Reportes automáticos con fotos/firma para que el cliente final confíe.
3. **Inventario y restocks** integrados (raro en otros SaaS del sector).
4. **IA aplicada**: Resúmenes, detección de anomalías y recomendaciones de upsell.
5. **Precio accesible**: Planes desde USD 99 con posibilidad de crecer sin migrar de sistema.

## 6. Precios y planes propuestos

| Plan        | Precio mensual (referencia)        | Límite sugerido                | Funcionalidades clave                                                                                                                       |
| ----------- | ---------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Starter** | USD 99                             | 5 propiedades / 10 usuarios    | Checklists premium, fotos y reportes básicos, portal estándar, 1 integración PMS.                                                           |
| **Growth**  | USD 249                            | 25 propiedades / 40 usuarios   | Todo lo anterior + plantillas personalizadas, inventario/restocks, alertas multicanal, IA resumen, portal white‑label, soporte prioritario. |
| **Scale**   | USD 499 base + bloques adicionales | 50+ propiedades / multi-tenant | API/webhooks, dashboard financiero, IA avanzada (detección, forecasting), soporte dedicado y success manager.                               |
| **Add-ons** | Según uso                          | N/A                            | Usuarios extra, integraciones personalizadas, consultoría/onboarding asistido, branding completo.                                           |

## 7. Roadmap de alto nivel

1. **Fase 0 — Descubrimiento**
   - Entrevistas con empresas objetivo.
   - Inventario de funcionalidades existentes (apps/web, apps/api) y brechas para multi-tenant/billing.
2. **Fase 1 — Fundaciones**
   - Multi-tenant en la API (tenantId, roles, permisos).
   - Autenticación unificada (usuarios de empresa + portal cliente).
   - Preparar data layer para IA (servicios, fotos, inventario).
3. **Fase 2 — MVP SaaS**
   - App crews (checklist + fotos + firmas).
   - Portal cliente white-label + alertas.
   - Panel admin con calendario, inventario y KPIs.
   - Primer módulo IA (resúmenes automáticos).
4. **Fase 3 — Pilotos**
   - 1‑2 empresas piloto con contratos de prueba.
   - Feedback loop y mejoras rápidas.
5. **Fase 4 — Escala**
   - Billing real (Stripe), marketplace de integraciones, IA avanzada (detección, forecasting), materiales de marketing.

## 8. Actualizaciones requeridas en documentación

1. **README.md**: Ajustar mensaje para reflejar el SaaS (no solo la operación Brisa Cubana).
2. **docs/operations/**: Actualizar runbooks (`production-setup`, `domain-map`) con multi-tenant y nuevo flujo comercial.
3. **docs/overview/** y `docs/development/`**:** Incorporar referencias al plan SaaS y a módulos IA.
4. **Landing copy**: Reescribir `apps/web/app/page.tsx` para vender el software (no servicios).
5. **Changelog**: Registrar la transición a SaaS (versión 0.5.0 en adelante).

> Nota: No modificar documentos históricos (`docs/archive/…`) hasta tener versiones nuevas aprobadas. Usar este archivo como referencia principal.

## 9. Próximos pasos inmediatos

1. Revisar y aprobar esta visión.
2. Crear issues/tareas para:
   - Reescritura de landing (copy + secciones SaaS).
   - Diseño multi-tenant en Prisma/API.
   - Definir MVP IA (resúmenes automáticos).
3. Preparar un one-pager comercial y formulario de interés en la landing.

---

**Historial**

- _2025-11-12_: Documento creado como fuente de verdad para la transición a SaaS. Autores: equipo fundador (2 personas).
- Próximas revisiones: agregar feedback de entrevistas y decisiones de pricing.
