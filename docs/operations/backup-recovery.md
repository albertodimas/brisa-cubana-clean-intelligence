# Backup y Recuperación de Datos

**Última actualización:** 14 de octubre de 2025
**Responsable:** Equipo DevOps
**Base de datos productiva:** Neon PostgreSQL 17

---

## 1. Estrategia de Backup

### 1.1 Point-in-Time Recovery (PITR) - Neon

**Estado actual:** ✅ ACTIVO

- **Retención configurada:** 7 días (configurable hasta 30 días según plan)
- **Granularidad:** Restauración a cualquier momento específico dentro de la ventana
- **Almacenamiento:** Automático en infraestructura de Neon
- **Costo:** Incluido en el plan, aumenta con ventana mayor

**Ventana de recuperación:**

- **RPO (Recovery Point Objective):** < 1 minuto
- **RTO (Recovery Time Objective):** < 5 minutos para restauraciones PITR

**Cómo restaurar:**

1. Acceder a Neon Console → Projects → brisa-cubana-clean-intelligence
2. Ir a "Branches" → Seleccionar branch "main"
3. Click en "Restore" → Selector de punto en el tiempo
4. El selector por defecto muestra el tiempo actual
5. Ajustar timestamp deseado y confirmar

**Configuración recomendada:**

```bash
# Para aumentar retención PITR (vía Neon Console):
# Settings → Backup → History Retention: 14 days
# Nota: Aumentar retención incrementa costos de storage
```

---

### 1.2 Backups pg_dump Automatizados

**Estado actual:** ✅ ACTIVO

**Objetivo:** Backup tradicional para:

- Compliance y auditoría
- Disaster recovery fuera de Neon
- Migración entre proveedores
- Retención a largo plazo (>30 días)

**Implementación actual:**

#### GitHub Actions Workflow

Ubicación: `.github/workflows/backup-database.yml`

**Triggers configurados:**

- **Automático:** Diario a las 2:00 AM UTC (cron: `0 2 * * *`)
- **Manual:** Disponible en Actions → Database Backup → Run workflow

**Características del workflow:**

1. **Tipos de backup automáticos:**
   - **Daily:** Lunes a sábado → Retención 7 días
   - **Weekly:** Domingos → Retención 30 días
   - **Monthly:** Día 1 de cada mes → Retención 365 días
   - **Manual:** Trigger manual → Retención configurable (7/30/365 días)

2. **Proceso de backup:**

   ```bash
   # Instalación PostgreSQL 17 client (pg_dump v17)
   sudo apt-get install -y postgresql-client-17

   # Creación del backup con pg_dump
   /usr/lib/postgresql/17/bin/pg_dump "$DATABASE_URL" \
     --no-owner \
     --no-privileges \
     --clean \
     --if-exists \
     --verbose \
     > backup_brisa_[type]_[timestamp].sql

   # Compresión gzip nivel 9
   gzip -9 backup_brisa_[type]_[timestamp].sql
   ```

3. **Verificación de integridad:**
   - Validación de archivo no vacío
   - Verificación de header PostgreSQL
   - Conteo de líneas (alerta si < 100)

4. **Metadata generada:**

   ```json
   {
     "backup_file": "backup_brisa_daily_20251008_020000.sql.gz",
     "backup_type": "daily",
     "timestamp": "20251008_020000",
     "retention_days": 7,
     "database": "neondb",
     "postgres_version": "17",
     "workflow_run_id": "...",
     "git_sha": "...",
     "created_at": "2025-10-08T02:00:00Z"
   }
   ```

5. **Almacenamiento:**
   - GitHub Actions Artifacts
   - Compresión: gzip -9 (sin compresión adicional de GitHub)
   - Nombres: `[type]-backup-[timestamp]`
   - Archivos incluidos: `.sql.gz`, `backup_metadata.json`, `backup.log`

6. **Limpieza automática:**
   - Ejecuta solo en backups programados (no manuales)
   - Política de retención por tipo:
     - `daily-backup-*`: 7 días
     - `weekly-backup-*`: 30 días
     - `monthly-backup-*`: 365 días
   - Elimina artifacts que exceden su retención

**Cómo ejecutar backup manual:**

```bash
# Opción 1: Desde GitHub UI
# 1. Ir a Actions → Database Backup → Run workflow
# 2. Seleccionar branch: main
# 3. Elegir retention_days: 7/30/365
# 4. Click "Run workflow"

# Opción 2: Desde CLI con gh
gh workflow run backup-database.yml --field retention_days=30

# Ver estado de ejecución
gh run list --workflow=backup-database.yml --limit 5
gh run watch

# Descargar último backup
gh run download [run-id]
```

**Política de retención implementada:**

- **Diarios:** 7 días (Lun-Sáb)
- **Semanales:** 30 días (Domingos)
- **Mensuales:** 365 días (día 1 de mes)

---

### 1.3 Alternativa con SimpleBackups (Third-party)

**Proveedor:** [SimpleBackups](https://simplebackups.com/)

**Características:**

- Backup automático a S3, Google Cloud Storage, Azure
- Configuración de schedule (diario, semanal)
- Políticas de retención personalizadas
- Notificaciones de fallo/éxito
- Encriptación en tránsito y reposo

**Costo estimado:** $7-15/mes según frecuencia y storage

---

## 2. Procedimientos de Recuperación

### 2.1 Recuperación desde PITR (Neon)

**Escenario:** Datos corruptos/borrados en las últimas 7 días

**Pasos:**

1. **Identificar timestamp objetivo:**

   ```bash
   # Revisar logs de aplicación para determinar cuándo ocurrió el problema
   vercel logs --since=2h
   ```

2. **Crear branch de prueba desde punto específico:**

   ```bash
   # Vía Neon Console:
   # Branches → Create branch from point-in-time
   # Name: "recovery-test-YYYYMMDD"
   # Base: main
   # Time: [timestamp deseado]
   ```

3. **Verificar datos en branch de prueba:**

   ```bash
   # Conectarse al branch de prueba
   psql "postgresql://user:pass@ep-xxx.neon.tech/neondb?options=endpoint%3Drecovery-test-YYYYMMDD"

   # Verificar datos críticos
   SELECT COUNT(*) FROM "User";
   SELECT COUNT(*) FROM "Booking";
   ```

4. **Promover branch a producción (si correcto):**

   ```bash
   # Opción 1: Promover branch (destructivo, reemplaza main)
   # Neon Console → Branches → recovery-test → Set as primary

   # Opción 2: Migrar datos selectivamente
   pg_dump "recovery-branch-url" | psql "main-branch-url"
   ```

**⚠️ IMPORTANTE:** Promover branch es destructivo. Siempre verificar en branch de prueba primero.

---

### 2.2 Recuperación desde pg_dump

**Escenario:** Disaster recovery, migración, corrupción más allá de PITR

**Pasos:**

1. **Listar y descargar backups disponibles:**

   ```bash
   # Listar workflows recientes
   gh run list --workflow=backup-database.yml --limit 10

   # Ver detalles de un run específico
   gh run view [run-id]

   # Descargar artifacts de un run
   gh run download [run-id]

   # Esto descarga en ./[artifact-name]/
   # Ejemplo: ./daily-backup-20251008_020000/
   #   - backup_brisa_daily_20251008_020000.sql.gz
   #   - backup_metadata.json
   #   - backup.log
   ```

2. **Descomprimir y verificar:**

   ```bash
   gunzip backup_brisa_20251008.sql.gz

   # Verificar integridad (primeras/últimas líneas)
   head -20 backup_brisa_20251008.sql
   tail -20 backup_brisa_20251008.sql
   ```

3. **Restaurar en branch de prueba:**

   ```bash
   # Crear branch limpio en Neon
   # recovery-restore-YYYYMMDD

   # Restaurar backup
   psql "postgresql://user:pass@ep-xxx.neon.tech/neondb?options=endpoint%3Drecovery-restore-YYYYMMDD" \
     < backup_brisa_20251008.sql
   ```

4. **Verificar y migrar a producción:**

   ```bash
   # Ejecutar smoke tests contra branch de prueba
   DATABASE_URL="..." pnpm --filter @brisa/api test

   # Si todo OK, coordinar ventana de mantenimiento
   # y promover branch o migrar datos
   ```

---

## 3. Verificación de Backups

### 3.1 Smoke Tests Post-Backup

**Script de verificación:**

```bash
#!/bin/bash
# scripts/verify-backup.sh

DATABASE_URL="${1}"

if [ -z "$DATABASE_URL" ]; then
  echo "Usage: $0 <database-url>"
  exit 1
fi

echo "🔍 Verificando integridad de backup..."

# Verificar conteos de tablas críticas
psql "$DATABASE_URL" -c "SELECT 'User' AS table, COUNT(*) FROM \"User\"
  UNION ALL SELECT 'Service', COUNT(*) FROM \"Service\"
  UNION ALL SELECT 'Property', COUNT(*) FROM \"Property\"
  UNION ALL SELECT 'Booking', COUNT(*) FROM \"Booking\";"

# Verificar constraints y foreign keys
psql "$DATABASE_URL" -c "SELECT
  tc.constraint_name,
  tc.table_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY')
ORDER BY tc.table_name, tc.constraint_type;"

echo "✅ Verificación completada"
```

**Frecuencia:** Ejecutar semanalmente contra último backup

---

### 3.2 Test de Restauración Completo

**Frecuencia:** Mensual
**Duración estimada:** 30 minutos
**Responsable:** DevOps + QA

**Checklist:**

- [ ] Descargar backup más reciente
- [ ] Crear branch temporal en Neon
- [ ] Restaurar backup completo
- [ ] Ejecutar smoke tests (`pnpm test`)
- [ ] Verificar conteos de registros vs producción
- [ ] Verificar últimas transacciones (bookings, servicios)
- [ ] Probar login con usuarios demo
- [ ] Documentar resultado en [issue tracker]
- [ ] Eliminar branch temporal

**Documento resultado:**

```markdown
## Test de Restauración - [FECHA]

**Backup usado:** backup_brisa_YYYYMMDD.sql.gz
**Branch temporal:** recovery-test-YYYYMMDD
**Resultado:** ✅ PASS / ❌ FAIL
**Tiempo de restauración:** XX minutos
**Issues encontrados:** [lista o "ninguno"]
**Acción requerida:** [lista o "ninguna"]
```

---

## 4. Monitoreo y Alertas

### 4.1 Indicadores Clave

**Métricas a monitorear:**

| Métrica                 | Umbral       | Acción                                       |
| ----------------------- | ------------ | -------------------------------------------- |
| Tamaño de base de datos | > 5 GB       | Revisar costos de PITR, considerar archivado |
| Crecimiento diario      | > 100 MB/día | Investigar logs, posible issue               |
| Conexiones activas      | > 80% pool   | Escalar compute, investigar leaks            |
| Query lenta (p99)       | > 1s         | Optimizar queries, añadir índices            |

**Alertas en Neon Console:**

- Configurar en "Settings → Alerts":
  - Database size > 4.5 GB (warning)
  - Storage usage > 90% (critical)
  - Compute hours > presupuesto mensual

---

### 4.2 Logs de Auditoría

**Registrar en [`docs/operations/backup-log.md`](backup-log.md)** una vez completada cada ejecución, incluyendo:

- Fecha/hora en UTC
- Responsable
- Procedimiento ejecutado (pg_dump, PITR, restore test)
- Resultado (✅/⚠️/❌) con enlace a la evidencia correspondiente
- Observaciones relevantes (tiempo de recuperación, incidentes detectados)

---

## 5. Contactos y Escalación

**En caso de emergencia de datos:**

1. **Notificar inmediatamente:**
   - DevOps Lead: [email/slack]
   - Database Admin: [email/slack]
   - Product Owner: [email/slack]

2. **Canales:**
   - Slack: #incidents-prod
   - Email: ops@brisacubanaclean.com

3. **Soporte Neon:**
   - Email: support@neon.tech
   - Dashboard: "Help & Support" → "Contact Support"
   - SLA: Respuesta en 4h (plan paid), 24h (plan free)

---

## 6. Siguiente Pasos de Implementación

### Completado ✅

- [x] Implementar GitHub Actions para pg_dump diario (`.github/workflows/backup-database.yml`)
- [x] Automatizar cleanup de backups antiguos (integrado en workflow)
- [x] Política de retención inteligente (daily/weekly/monthly)
- [x] Verificación de integridad automática
- [x] Metadata tracking para cada backup

### Prioridad ALTA

- [ ] Ejecutar primer backup manual para validar workflow
- [ ] Documentar primer test de restauración completo
- [ ] Configurar alertas en Neon Console

### Prioridad MEDIA

- [ ] Establecer calendario de tests mensuales de restauración
- [ ] Crear script verify-backup.sh standalone
- [ ] Crear runbook detallado de incidentes
- [ ] Configurar storage S3/GCS para backups externos (opcional)

### Prioridad BAJA

- [ ] Evaluar SimpleBackups como alternativa
- [ ] Integrar métricas de backup en dashboard
- [ ] Implementar backups incrementales (si se necesita optimizar storage)

---

**Referencias:**

- [Neon Backups Documentation](https://neon.com/docs/manage/backups)
- [PostgreSQL pg_dump Manual](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Disaster Recovery Best Practices](https://neon.com/docs/manage/backup-pg-dump)
