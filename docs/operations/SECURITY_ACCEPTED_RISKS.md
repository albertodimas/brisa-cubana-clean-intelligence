# Security Accepted Risks

**Última actualización:** 2025-10-04
**Responsable:** Platform Engineering
**Próxima revisión:** 2026-01-04 (trimestral)

---

## Resumen Ejecutivo

Este documento registra las vulnerabilidades de seguridad conocidas que han sido evaluadas y aceptadas como riesgo controlado. Estas vulnerabilidades están activamente monitoreadas a través de escaneos automatizados.

## Estado Actual

- **Total de riesgos aceptados:** 25 CVEs
- **Nivel de severidad máximo:** LOW
- **Impacto en producción:** Mínimo
- **Mitigaciones activas:** Sí (ver sección de Controles)

---

## Vulnerabilidades en Imágenes Docker Base

### Contexto

Las imágenes Docker de producción (`api` y `web`) utilizan `gcr.io/distroless/nodejs24-debian12:nonroot` como imagen base. Esta es una imagen hardened de Google diseñada para minimizar la superficie de ataque mediante:

- Sin shell (no bash, no sh)
- Sin package managers (no apt, no apk)
- Solo runtime esenciales
- Ejecuta como usuario no-root (uid 65532)
- Filesystem read-only donde sea posible

### CVE-2022-27943 - binutils rust-demangle Stack Exhaustion

- **Componente:** libstdc++6 12.2.0-14+deb12u1
- **Severidad:** LOW
- **Descripción:** Permite stack exhaustion en demangle_const durante demangling de símbolos Rust
- **Ocurrencias:** 9 alertas (api y web)
- **Fixed Version:** No disponible
- **Justificación de aceptación:**
  - Requiere input malicioso específicamente crafted a funciones de demangling
  - Aplicación no procesa símbolos Rust directamente
  - DoS local, no explotable remotamente en nuestra arquitectura
  - Sin patch disponible de Debian
- **Fecha de aceptación:** 2025-10-04
- **Referencias:**
  - [CVE-2022-27943](https://avd.aquasec.com/nvd/cve-2022-27943)
  - [NVD](https://nvd.nist.gov/vuln/detail/CVE-2022-27943)

### CVE-2025-27587 - Pending Analysis

- **Componente:** Sistema base Debian 12
- **Severidad:** LOW
- **Ocurrencias:** 2 alertas (api y web)
- **Fixed Version:** No disponible
- **Justificación de aceptación:**
  - CVE recién publicado (2025)
  - Severidad LOW confirmada
  - Monitoreo activo para cuando esté disponible patch
- **Fecha de aceptación:** 2025-10-04

### CVE-2019-xxxx Series - glibc Legacy Vulnerabilities

Conjunto de 5 CVEs antiguos (2019) en glibc:

- **CVE-2019-9192** - Integer overflow en glibc (LOW)
- **CVE-2019-1010025** - glibc integer overflow (LOW)
- **CVE-2019-1010024** - glibc integer overflow (LOW)
- **CVE-2019-1010023** - glibc heap buffer overflow (LOW)
- **CVE-2019-1010022** - glibc stack overflow (LOW)

**Componente:** glibc (GNU C Library)
**Severidad:** LOW
**Ocurrencias:** 10 alertas total
**Fixed Version:** No disponible en Debian 12
**Justificación de aceptación:**

- Vulnerabilidades conocidas desde 2019, sin explotación activa reportada
- Requieren condiciones muy específicas (integer overflow en edge cases)
- glibc es fundamental para el sistema, actualización requiere rebuild completo de imagen
- Debian Security Team no ha emitido DSA (Debian Security Advisory)
- Impacto mitigado por arquitectura containerizada
- **Fecha de aceptación:** 2025-10-04
- **Referencias:**
  - [CVE-2019-9192](https://nvd.nist.gov/vuln/detail/CVE-2019-9192)
  - [Debian Security Tracker](https://security-tracker.debian.org/tracker/)

### CVE-2018-20796, CVE-2010-4756 - glibc Ancient Vulnerabilities

- **Componente:** glibc
- **Severidad:** LOW
- **Años:** 2010, 2018
- **Ocurrencias:** 4 alertas
- **Fixed Version:** No disponible
- **Justificación de aceptación:**
  - Vulnerabilidades de más de 5-10 años sin explotación activa
  - Severidad extremadamente baja
  - Parte del sistema base, no actualizable sin cambio mayor
- **Fecha de aceptación:** 2025-10-04

---

## Controles y Mitigaciones Activas

### 1. Escaneo Continuo

- **Workflow:** `.github/workflows/security-scan.yml`
- **Frecuencia:** Cada push, PR, y diario (cron 2 AM UTC)
- **Herramientas:**
  - Trivy (container scanning)
  - CodeQL (SAST)
  - Snyk (dependency scanning)
  - TruffleHog (secrets detection - solo PRs y schedule)

### 2. Arquitectura de Seguridad

- **Network Isolation:** Containers ejecutan en redes privadas
- **Least Privilege:** Non-root user (uid 65532)
- **Read-only Filesystem:** Donde sea posible
- **Resource Limits:** CPU y memoria limitados
- **Secrets Management:** Variables de entorno nunca commitadas
- **HTTPS Only:** Todas las comunicaciones encriptadas

### 3. Monitoreo en Producción

- **Runtime Security:** (Pendiente - Falco o similar)
- **Log Aggregation:** Centralizados y monitoreados
- **Alertas:** Configuradas para anomalías
- **Incident Response:** Plan documentado

### 4. Proceso de Actualización

- **Dependencias npm:** Actualizadas semanalmente (Renovate/Dependabot)
- **Imagen base:** Siguiendo canal stable de Google Distroless
- **Security patches:** Aplicados dentro de 30 días si severidad >= MEDIUM

---

## Matriz de Riesgo

| CVE              | Severidad | Explotabilidad | Impacto | Riesgo Residual |
| ---------------- | --------- | -------------- | ------- | --------------- |
| CVE-2022-27943   | LOW       | Muy Baja       | DoS     | **ACEPTADO**    |
| CVE-2025-27587   | LOW       | Desconocida    | TBD     | **MONITOREADO** |
| CVE-2019-9192    | LOW       | Muy Baja       | Mínimo  | **ACEPTADO**    |
| CVE-2019-1010025 | LOW       | Muy Baja       | Mínimo  | **ACEPTADO**    |
| CVE-2019-1010024 | LOW       | Muy Baja       | Mínimo  | **ACEPTADO**    |
| CVE-2019-1010023 | LOW       | Muy Baja       | Mínimo  | **ACEPTADO**    |
| CVE-2019-1010022 | LOW       | Muy Baja       | Mínimo  | **ACEPTADO**    |
| CVE-2018-20796   | LOW       | Muy Baja       | Mínimo  | **ACEPTADO**    |
| CVE-2010-4756    | LOW       | Muy Baja       | Mínimo  | **ACEPTADO**    |

---

## Criterios de Re-evaluación

Se debe re-evaluar la aceptación si:

1. ✋ **Cambio de severidad** - CVE es reclasificado a MEDIUM o superior
2. ✋ **Exploit público** - Se publica PoC (Proof of Concept) funcional
3. ✋ **Fix disponible** - Debian/Google libera patch
4. ✋ **Explotación activa** - Se detecta explotación in-the-wild
5. ✋ **Compliance requirement** - Auditoría o regulación lo requiere

## Proceso de Escalación

Si alguna vulnerabilidad cumple los criterios de re-evaluación:

1. **Platform Engineering** revisa inmediatamente
2. Se crea issue de alta prioridad en GitHub
3. Se evalúa workaround temporal
4. Se planifica actualización en next sprint
5. Se notifica a stakeholders si impacta SLA

---

## Auditoría y Compliance

### SOC 2 / ISO 27001

- ✅ Riesgos documentados y aprobados
- ✅ Controles compensatorios en lugar
- ✅ Revisión trimestral programada
- ✅ Evidencia de escaneo continuo

### GDPR / Privacidad

- ✅ Sin impacto en datos personales
- ✅ Vulnerabilidades no afectan confidencialidad de PII
- ✅ Controles de acceso siguen vigentes

---

## Historial de Cambios

| Fecha      | Versión | Cambio                            | Autor                |
| ---------- | ------- | --------------------------------- | -------------------- |
| 2025-10-04 | 1.0     | Documento inicial con 25 CVEs LOW | Platform Engineering |

---

## Aprobaciones

**Requeridas para riesgos LOW:**

- [x] Platform Engineering Lead
- [ ] Security Officer (si existe el rol)
- [ ] CTO/VP Engineering (para riesgos MEDIUM+)

**Próxima revisión programada:** 2026-01-04

---

## Referencias

- [Trivy Vulnerability Database](https://avd.aquasec.com/)
- [National Vulnerability Database (NVD)](https://nvd.nist.gov/)
- [Debian Security Tracker](https://security-tracker.debian.org/tracker/)
- [Google Distroless Images](https://github.com/GoogleContainerTools/distroless)
- [OWASP Risk Rating Methodology](https://owasp.org/www-community/OWASP_Risk_Rating_Methodology)

---

**Nota:** Este documento es parte del programa de Security Governance y debe mantenerse actualizado. Para reportar nuevas vulnerabilidades o cuestionar un riesgo aceptado, abrir un issue en GitHub con label `security`.
