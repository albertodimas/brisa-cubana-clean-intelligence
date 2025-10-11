# Backup Run Log

Registro verificado de ejecuciones de respaldo para Brisa Cubana Clean Intelligence. Completa una entrada cada vez que se ejecuta `scripts/verify-backup.sh` o se realiza un `pg_dump` manual.

| Fecha (UTC) | Ejecutado por | Procedimiento | Resultado | Evidencia |
| ----------- | ------------- | ------------- | --------- | --------- |
| _Pendiente_ | —             | —             | —         | —         |

## Cómo registrar un respaldo

1. Ejecuta el procedimiento descrito en [`backup-recovery.md`](backup-recovery.md).
2. Guarda la evidencia correspondiente (archivo `.log`, suma de verificación, artefacto en almacenamiento seguro).
3. Añade una fila en la tabla anterior usando el commit que contenga la evidencia.
4. Actualiza el estado en [`overview/status.md`](../overview/status.md) si se detecta algún incidente.

> Este archivo solo debe contener ejecuciones completadas y verificadas. No registres pruebas fallidas ni planes futuros.
