# 🚀 Quick Start - Brisa Cubana

Guía rápida para poner en marcha la plataforma en **menos de 5 minutos**.

---

## ⚡ Inicio Ultra-Rápido

```bash
# 1. Clonar e instalar
git clone https://github.com/albertodimas/brisa-cubana-clean-intelligence.git
cd brisa-cubana-clean-intelligence
pnpm install

# 2. Iniciar todo de una vez
./scripts/start-local.sh

# 3. Abrir en el navegador
# http://localhost:3000
```

¡Listo! 🎉

---

## 📋 Requisitos Previos

- **Node.js** 18+ ([Descargar](https://nodejs.org/))
- **pnpm** 8+ (`npm install -g pnpm`)
- **Docker Desktop** ([Descargar](https://www.docker.com/products/docker-desktop/))

---

## 🎯 Opciones del Script

El script `start-local.sh` te da un menú interactivo:

```
1. Iniciar API Backend
2. Iniciar Frontend
3. Iniciar todo (API + Frontend)
4. Ver estado de servicios
5. Salir
```

**Recomendado**: Opción 3 (Iniciar todo)

---

## 🔧 Inicio Manual (Alternativa)

Si prefieres control manual:

### 1. Base de Datos

```bash
docker compose up -d
cd apps/api
pnpm prisma migrate deploy
```

### 2. API Backend

```bash
cd apps/api
pnpm dev
# Escucha en http://localhost:3001
```

### 3. Frontend (en otra terminal)

```bash
cd apps/web
pnpm dev
# Escucha en http://localhost:3000
```

---

## 🌐 URLs de Acceso

| Servicio        | URL                           | Descripción              |
| --------------- | ----------------------------- | ------------------------ |
| 🏠 **Frontend** | http://localhost:3000         | Aplicación web principal |
| 📡 **API**      | http://localhost:3001         | Backend REST API         |
| 💚 **Health**   | http://localhost:3001/health  | Estado de la API         |
| 📊 **Metrics**  | http://localhost:9464/metrics | Prometheus metrics       |
| 🗄️ **Database** | localhost:5433                | PostgreSQL (interno)     |

---

## ✅ Verificación

### Comprobar que todo funciona

```bash
# Health check de la API
curl http://localhost:3001/health

# Deberías ver:
# {"status":"healthy","service":"brisa-cubana-api",...}
```

### Ver logs

```bash
# Logs de PostgreSQL
docker logs -f brisa-cubana-postgres-dev

# Logs de la API
# (en la terminal donde corriste `pnpm dev`)

# Logs del Frontend
# (en la terminal donde corriste `pnpm dev` en apps/web)
```

---

## 🧪 Tests

```bash
# Correr todos los tests
pnpm test

# Tests en modo watch
pnpm test:watch

# Tests con coverage
pnpm test:coverage

# Lint y typecheck
pnpm turbo run lint typecheck
```

---

## 🔑 Credenciales de Desarrollo

### Base de Datos

- **Host**: localhost
- **Port**: 5433
- **User**: postgres
- **Password**: postgres
- **Database**: brisa_cubana_dev

### JWT Secret

Configurado automáticamente en `apps/api/.env`

---

## 🐛 Solución de Problemas

### Error: "Puerto 3001 ya está en uso"

```bash
# Encontrar el proceso
lsof -i :3001

# Matar el proceso
kill -9 <PID>
```

### Error: "Cannot connect to PostgreSQL"

```bash
# Verificar que Docker está corriendo
docker ps

# Si no está corriendo:
docker compose up -d
```

### Error: "ENOSPC: System limit for number of file watchers reached"

```bash
# Aumentar límite de file watchers
sudo sysctl fs.inotify.max_user_watches=524288
```

### Error: "Prisma Client not generated"

```bash
cd apps/api
pnpm prisma generate
```

---

## 📚 Más Información

- **Documentación completa**: [README.md](./README.md)
- **Estado de la plataforma**: [PLATFORM_STATUS.md](./PLATFORM_STATUS.md)
- **Próximos pasos**: [PROXIMOS_PASOS.md](./PROXIMOS_PASOS.md)
- **API Endpoints**: [apps/api/API_ENDPOINTS.md](./apps/api/API_ENDPOINTS.md)

---

## 🎨 Primeros Pasos en la App

1. **Abre** http://localhost:3000
2. **Registra** una cuenta nueva
3. **Explora** las funcionalidades
4. **Prueba** hacer una reserva
5. **Revisa** las métricas en http://localhost:9464/metrics

---

## 🆘 Ayuda

¿Problemas? Revisa:

1. [PLATFORM_STATUS.md](./PLATFORM_STATUS.md) - Estado actual
2. [docs/operations/](./docs/operations/) - Guías operacionales
3. [GitHub Issues](https://github.com/albertodimas/brisa-cubana-clean-intelligence/issues) - Reportar bugs

---

## 🚀 Próximo Nivel

Una vez que todo funcione localmente:

1. **Deploy a producción** → Ver [docs/operations/DEPLOYMENT.md](./docs/operations/DEPLOYMENT.md)
2. **Contribuir** → Ver [CONTRIBUTING.md](./CONTRIBUTING.md)
3. **Seguridad** → Ver [SECURITY.md](./SECURITY.md)

---

**¿Listo para producción?** Todos los tests pasan ✅  
**Tiempo estimado**: ⏱️ 5 minutos  
**Dificultad**: 🟢 Fácil

¡Feliz desarrollo! 🎉
