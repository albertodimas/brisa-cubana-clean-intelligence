# Backup y Recuperación de Datos

**Última actualización:** 8 de octubre de 2025
**Responsable:** Equipo DevOps
**Base de datos productiva:** Neon PostgreSQL 16

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

**Estado actual:** ⚠️ PENDIENTE IMPLEMENTACIÓN

**Objetivo:** Backup tradicional para:

- Compliance y auditoría
- Disaster recovery fuera de Neon
- Migración entre proveedores
- Retención a largo plazo (>30 días)

**Configuración planeada:**

#### GitHub Actions Workflow

```yaml
# .github/workflows/backup-database.yml
name: Database Backup

on:
  schedule:
    - cron: "0 2 * * *" # Diario a las 2:00 AM UTC
  workflow_dispatch: # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Install PostgreSQL client
        run: sudo apt-get update && sudo apt-get install -y postgresql-client

      - name: Create backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          TIMESTAMP=$(date +%Y%m%d_%H%M%S)
          BACKUP_FILE="backup_brisa_$TIMESTAMP.sql"

          pg_dump "$DATABASE_URL" \
            --no-owner \
            --no-privileges \
            --clean \
            --if-exists \
            > "$BACKUP_FILE"

          gzip "$BACKUP_FILE"
          echo "BACKUP_FILE=${BACKUP_FILE}.gz" >> $GITHUB_ENV

      - name: Upload to S3 (optional)
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          # Instalar AWS CLI y subir
          # aws s3 cp "$BACKUP_FILE" s3://bucket-name/backups/
          echo "Placeholder: Subir a storage externo"

      - name: Retention policy
        run: |
          # Mantener últimos 30 backups
          # Eliminar backups > 30 días
          echo "Placeholder: Aplicar política de retención"
```

**Política de retención recomendada:**

- **Diarios:** 7 días
- **Semanales:** 4 semanas
- **Mensuales:** 12 meses

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

1. **Listar backups disponibles:**

   ```bash
   # Si están en GitHub Artifacts:
   gh run list --workflow=backup-database.yml
   gh run download [run-id]

   # Si están en S3:
   aws s3 ls s3://bucket-name/backups/
   aws s3 cp s3://bucket-name/backups/backup_brisa_20251008.sql.gz .
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

**Registrar en docs/backup-log.md:**

```markdown
## Log de Backups y Recuperaciones

| Fecha      | Tipo              | Estado | Notas                    |
| ---------- | ----------------- | ------ | ------------------------ |
| 2025-10-08 | PITR verificado   | ✅ OK  | Retención 7 días activa  |
| 2025-10-15 | Test restauración | ✅ OK  | Backup 2025-10-14, 15min |
| ...        | ...               | ...    | ...                      |
```

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

### Prioridad ALTA

- [ ] Implementar GitHub Actions para pg_dump diario
- [ ] Configurar storage S3/GCS para backups externos
- [ ] Crear script verify-backup.sh y añadir a CI
- [ ] Documentar primer test de restauración

### Prioridad MEDIA

- [ ] Configurar alertas en Neon Console
- [ ] Establecer calendario de tests mensuales
- [ ] Evaluar SimpleBackups como alternativa
- [ ] Crear runbook de incidentes

### Prioridad BAJA

- [ ] Automatizar cleanup de backups antiguos
- [ ] Integrar métricas de backup en dashboard
- [ ] Implementar backups incrementales

---

**Referencias:**

- [Neon Backups Documentation](https://neon.com/docs/manage/backups)
- [PostgreSQL pg_dump Manual](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Disaster Recovery Best Practices](https://neon.com/docs/manage/backup-pg-dump)
