# Operational Readiness Review (ORR)

**Propósito:** puerta de control obligatoria antes de ejecutar despliegues relevantes de Brisa Cubana Clean Intelligence.  
**Versión:** 1.1  
**Última actualización:** 2 de octubre de 2025

La revisión de preparación operacional es requisito para cualquier release que incorpore funcionalidades críticas, cambios de infraestructura, modificaciones de esquema de base de datos o componentes que afecten pagos y seguridad. No se autoriza un despliegue productivo sin completar satisfactoriamente esta revisión.

---

## 1. Checklist ORR

### 1.1 Calidad de código

- [ ] CI en verde (lint, typecheck, unit tests, E2E).
- [ ] Cobertura ≥ 75% en líneas y ≥ 70% en funciones.
- [ ] Sin vulnerabilidades críticas (Snyk, Trivy, CodeQL).
- [ ] TruffleHog sin hallazgos de secretos.
- [ ] Pull Requests revisadas (≥2 aprobaciones para cambios productivos).
- [ ] `CHANGELOG.md` actualizado con notas del release.

### 1.2 Pruebas

- [ ] Pruebas unitarias (171) con resultado satisfactorio.
- [ ] Pruebas de integración validadas (contratos API, DB).
- [ ] Pruebas E2E (15 escenarios) superadas.
- [ ] Pruebas de carga sobre staging (≥1000 req/min durante 30 min).
- [ ] Pruebas de resistencia/soak (24 h al 50% del pico, sin fugas).
- [ ] Smoke tests documentados para flujos críticos (login, reserva, pago).

### 1.3 Infraestructura y build

- [ ] IaC revisada (`infra/`) con paridad declarada.
- [ ] Imágenes Docker multi-stage, usuario no root, base distroless.
- [ ] SBOM generado (Syft).
- [ ] Imagen firmada (Cosign/Sigstore).
- [ ] Healthchecks implementados (liveness/readiness/startup).
- [ ] Límites de recursos configurados (CPU/memoria).

### 1.4 Base de datos

- [ ] Migraciones verificadas en staging (patrón expand/contract).
- [ ] Scripts de backfill revisados (idempotentes y reversibles).
- [ ] Backup restaurable probado en ≤7 días.
- [ ] Índices evaluados (evitar full scans en tablas grandes).
- [ ] Pooling configurado (máximo de conexiones y timeouts).
- [ ] Plan de reversión documentado.

### 1.5 Observabilidad

- [ ] Logging estructurado con correlación (`requestId`, `userId`).
- [ ] Métricas instrumentadas (RED + USE).
- [ ] Trazas distribuidas habilitadas (OpenTelemetry).
- [ ] Dashboards disponibles (Grafana/CloudWatch) con SLO definidos.
- [ ] Alertas configuradas (errores, latencia, pagos, base de datos).
- [ ] Enrutamiento de alertas verificado (PagerDuty, Slack).

### 1.6 Seguridad

- [ ] TLS configurado (≥1.2) y certificados válidos.
- [ ] Cabeceras de seguridad (CSP, HSTS, X-Frame-Options, etc.).
- [ ] WAF activo (rate limit, protección bots, bloqueo IP).
- [ ] Gestión de secretos centralizada (Vault/KMS).
- [ ] Plan de rotación ≤90 días documentado.
- [ ] SAST/DAST sin hallazgos críticos.
- [ ] Escaneo de dependencias actualizado (Snyk/Dependabot).
- [ ] SBOM publicado en repositorio interno.

### 1.7 Estrategia de despliegue

- [ ] Estrategia Blue/Green o Canary definida.
- [ ] Pipeline de despliegue probado extremo a extremo.
- [ ] Reglas de análisis de canary (errores, latencia) documentadas.
- [ ] Feature flags preparados (valores seguros y plan gradual).
- [ ] Plan de rollback actualizado (`ROLLBACK.md`).
- [ ] Ventana de despliegue confirmada (martes/miércoles 10:00–12:00 EDT).

### 1.8 Documentación y runbooks

- [ ] Runbook de Go-Live actualizado.
- [ ] Runbook de Rollback actualizado.
- [ ] Plan de respuesta a incidentes revisado.
- [ ] Diagramas de arquitectura vigentes.
- [ ] Referencia de API actualizada (OpenAPI/Swagger).
- [ ] Plan de continuidad (DR/RTO/RPO) validado.

### 1.9 Preparación operativa

- [ ] Guardia primaria/secundaria confirmada.
- [ ] Pruebas en PagerDuty/Slack superadas.
- [ ] Status page configurada y lista para comunicación.
- [ ] Plan de comunicaciones listo (correo, redes, soporte).
- [ ] Equipo de soporte alineado (nuevas funcionalidades, issues conocidos).
- [ ] Monitoreo intensivo definido (72 h, triggers específicos).

### 1.10 Continuidad de negocio

- [ ] SLO definidos (disponibilidad, latencia, tasa de errores).
- [ ] Presupuesto de errores vigente y consumo registrado.
- [ ] Estimación de costos revisada (FinOps).
- [ ] Plan de capacidad actualizado (proyección de tráfico).
- [ ] Cumplimiento regulatorio aprobado (GDPR/CCPA/PCI-DSS).
- [ ] Aprobación ejecutiva y de producto registrada.

---

## 2. Ponderación y puntuación

| Categoría         | Peso | Puntaje (0-10) | Ponderado    |
| ----------------- | ---- | -------------- | ------------ |
| Calidad de código | 15%  | \_\_           | \_\_         |
| Pruebas           | 15%  | \_\_           | \_\_         |
| Infraestructura   | 10%  | \_\_           | \_\_         |
| Base de datos     | 10%  | \_\_           | \_\_         |
| Observabilidad    | 15%  | \_\_           | \_\_         |
| Seguridad         | 15%  | \_\_           | \_\_         |
| Despliegue        | 10%  | \_\_           | \_\_         |
| Documentación     | 5%   | \_\_           | \_\_         |
| Operaciones       | 5%   | \_\_           | \_\_         |
| Negocio           | 5%   | \_\_           | \_\_         |
| **Total**         | 100% | **\_\_**       | **\_\_/100** |

- Mínimo aceptable para proceder: **80/100**.
- 90–100: excelente; 80–89: proceder con cautela; 70–79: posponer; <70: no apto.

---

## 3. Go/No-Go

**Fecha:** **\*\***\_\_**\*\***  
**Revisado por:** **\*\***\_\_**\*\***

| Criterio                             | Estado       | Observaciones          |
| ------------------------------------ | ------------ | ---------------------- |
| ORR ≥ 80                             | ☐ GO ☐ NO-GO | Puntaje: \_\_\_\_      |
| Sin incidentes Sev1/Sev2 últimos 7 d | ☐ GO ☐ NO-GO | Incidentes: \_\_\_\_   |
| Presupuesto de error disponible      | ☐ GO ☐ NO-GO | Uso: \_\_\_\_ %        |
| Ventana confirmada                   | ☐ GO ☐ NO-GO | Fecha/Hora: \_\_\_\_   |
| Plan de rollback validado            | ☐ GO ☐ NO-GO | Revisor: \_\_\_\_      |
| Firmas de stakeholders               | ☐ GO ☐ NO-GO | Aprobaciones: \_\_\_\_ |

**Decisión final:** ☐ GO ☐ NO-GO (motivo en caso de bloqueo).

---

## 4. Firmas

| Rol                | Nombre | Firma | Fecha |
| ------------------ | ------ | ----- | ----- |
| Engineering Lead   |        |       |       |
| SRE Lead           |        |       |       |
| Security Lead      |        |       |       |
| Product Owner      |        |       |       |
| CTO/VP Engineering |        |       |       |

---

## 5. Gaps frecuentes y mitigaciones

| Gap identificado                   | Riesgo                                      | Acción correctiva                           | Tiempo estimado |
| ---------------------------------- | ------------------------------------------- | ------------------------------------------- | --------------- |
| Pruebas de carga pendientes        | Rendimiento desconocido bajo tráfico real   | Ejecutar k6/Gatling (1000 req/min, 30 min)  | 1 día           |
| Plan de rollback incompleto        | Recuperación lenta ante incidente           | Actualizar `ROLLBACK.md`                    | 2 horas         |
| Canary inexistente                 | Exposición total a regresiones              | Implementar canary al 10% con métricas      | 1 día           |
| Alertas sin prueba de enrutamiento | Falta de notificación o escalamiento        | Simular alertas y verificar PagerDuty/Slack | 1 hora          |
| Backup sin restauración validada   | Recuperación incierta ante pérdida de datos | Ejecutar prueba de restauración             | 0.5 día         |

---

**Responsable de mantenimiento:** Plataforma e Ingeniería de Fiabilidad.
