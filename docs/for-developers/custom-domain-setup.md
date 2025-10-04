# Configuración de Dominio Personalizado para GitHub Pages

Guía paso a paso para configurar un dominio custom (ej: `docs.brisacubana.com`) para la documentación de GitHub Pages.

## Estado Actual

- **URL actual**: `https://albertodimas.github.io/brisa-cubana-clean-intelligence/`
- **URL objetivo**: `https://docs.brisacubana.com` (ejemplo)
- **SSL**: Manejado automáticamente por GitHub Pages
- **CDN**: Incluido sin costo adicional

## Prerrequisitos

1. ✅ GitHub Pages configurado y funcionando
2. 🛒 Dominio registrado (ej: `brisacubana.com`)
3. 🔑 Acceso al panel de DNS de tu proveedor de dominio

## Opción 1: Subdominio (Recomendado)

### Ventajas

- ✅ Más fácil de configurar
- ✅ No afecta el dominio principal
- ✅ Mejor separación de servicios
- ✅ HTTPS automático más rápido

### Configuración DNS

**Paso 1:** Agregar registro CNAME en tu proveedor DNS

```
Tipo:     CNAME
Host:     docs
Apunta a: albertodimas.github.io
TTL:      3600 (1 hora)
```

**Ejemplos por proveedor:**

#### Cloudflare

```yaml
Type: CNAME
Name: docs
Target: albertodimas.github.io
Proxy: ✅ Proxied (naranja) - Recomendado
TTL: Auto
```

#### Namecheap

```yaml
Type: CNAME Record
Host: docs
Value: albertodimas.github.io.
TTL: Automatic
```

#### GoDaddy

```yaml
Type: CNAME
Name: docs
Value: albertodimas.github.io
TTL: 1 Hour
```

#### Google Domains

```yaml
Type: CNAME
Name: docs
Data: albertodimas.github.io.
TTL: 1h
```

**Paso 2:** Configurar en GitHub

```bash
# Opción A: Via GitHub CLI
gh api -X PUT repos/albertodimas/brisa-cubana-clean-intelligence/pages \
  -f source[branch]=gh-pages \
  -f source[path]=/ \
  -f cname=docs.brisacubana.com

# Opción B: Via Web
# 1. Ir a Settings → Pages
# 2. En "Custom domain", escribir: docs.brisacubana.com
# 3. Click "Save"
# 4. Esperar verificación DNS
```

**Paso 3:** Agregar archivo CNAME al repositorio

```bash
# El archivo debe estar en la rama gh-pages
# Mike lo manejará automáticamente si está en docs/
echo "docs.brisacubana.com" > docs/CNAME
git add docs/CNAME
git commit -m "feat(docs): agregar dominio custom"
git push
```

**Paso 4:** Habilitar HTTPS (automático)

GitHub detectará tu dominio custom y generará un certificado SSL gratuito via Let's Encrypt.

⏱️ **Tiempo estimado:** 5-10 minutos después de la verificación DNS

### Verificación

```bash
# Verificar configuración DNS
dig docs.brisacubana.com CNAME +short
# Debe retornar: albertodimas.github.io.

# Verificar HTTPS
curl -I https://docs.brisacubana.com
# Debe retornar: HTTP/2 200
```

## Opción 2: Apex Domain (Avanzado)

### Ventajas

- ✅ URL más corta: `brisacubana.com/docs`
- ✅ Branding más fuerte

### Desventajas

- ⚠️ Configuración más compleja
- ⚠️ Posibles conflictos con otros servicios
- ⚠️ No todos los DNS providers lo soportan bien

### Configuración DNS

**Paso 1:** Agregar registros A

```
Tipo:  A
Host:  @
Value: 185.199.108.153
TTL:   3600

Tipo:  A
Host:  @
Value: 185.199.109.153
TTL:   3600

Tipo:  A
Host:  @
Value: 185.199.110.153
TTL:   3600

Tipo:  A
Host:  @
Value: 185.199.111.153
TTL:   3600
```

**Paso 2:** Agregar registro AAAA (IPv6)

```
Tipo:  AAAA
Host:  @
Value: 2606:50c0:8000::153
TTL:   3600

Tipo:  AAAA
Host:  @
Value: 2606:50c0:8001::153
TTL:   3600

Tipo:  AAAA
Host:  @
Value: 2606:50c0:8002::153
TTL:   3600

Tipo:  AAAA
Host:  @
Value: 2606:50c0:8003::153
TTL:   3600
```

**⚠️ Advertencia:** Esto apuntará TODO tu dominio a GitHub Pages, no solo `/docs`.

## Troubleshooting

### Error: "Domain is already taken"

El dominio está configurado en otro repositorio de GitHub.

**Solución:**

1. Verifica en otros repositorios tuyos
2. Si no lo encuentras, puede ser un conflicto de caché
3. Espera 24h y vuelve a intentar

### Error: "Improperly configured domain"

El DNS no está propagado o configurado incorrectamente.

**Solución:**

```bash
# Verificar propagación DNS
nslookup docs.brisacubana.com

# Verificar registros específicos
dig docs.brisacubana.com +trace

# Verificar desde múltiples ubicaciones
# https://www.whatsmydns.net/
```

### HTTPS no se activa

**Causas comunes:**

1. DNS aún propagándose (esperar 24h)
2. Certificado Let's Encrypt fallando
3. Registro CAA bloqueando emisión

**Solución:**

```bash
# Verificar registros CAA
dig brisacubana.com CAA +short

# Si hay CAA records, agregar:
# Type: CAA
# Name: @
# Value: 0 issue "letsencrypt.org"
```

### Páginas 404 después del cambio

**Causa:** Cambio de base URL en mkdocs.yml

**Solución:**

```yaml
# mkdocs.yml
site_url: https://docs.brisacubana.com/
# Si usas subdirectorio:
# site_url: https://brisacubana.com/docs/
```

## Costos

| Componente          | Costo Anual    | Proveedor Ejemplo       |
| ------------------- | -------------- | ----------------------- |
| **Dominio .com**    | $10-15         | Namecheap, GoDaddy      |
| **GitHub Pages**    | GRATIS         | GitHub                  |
| **SSL Certificate** | GRATIS         | Let's Encrypt (auto)    |
| **CDN**             | GRATIS         | GitHub Pages (incluido) |
| **TOTAL**           | **$10-15/año** | -                       |

## Mejores Prácticas

### 1. Usar Cloudflare (Opcional)

**Ventajas:**

- ✅ DNS rápido (1.1.1.1)
- ✅ Protección DDoS incluida
- ✅ Analytics gratis
- ✅ Cache adicional
- ✅ Gestión de SSL mejorada

**Configuración:**

```yaml
# En Cloudflare
Proxy status: ✅ Proxied (naranja)
SSL/TLS mode: Full (strict)
Always Use HTTPS: ON
Auto Minify: HTML, CSS, JS
Brotli: ON
```

### 2. Configurar Redirects

```yaml
# En GitHub Pages, agregar a mkdocs.yml:
extra:
  alternate:
    - link: https://albertodimas.github.io/brisa-cubana-clean-intelligence/
      name: GitHub Pages (legacy)
```

### 3. Actualizar Links

```bash
# Buscar y reemplazar URLs antiguas
grep -r "albertodimas.github.io" docs/
# Reemplazar con: docs.brisacubana.com
```

## Checklist de Implementación

- [ ] Registrar dominio
- [ ] Configurar DNS (CNAME o A records)
- [ ] Verificar propagación DNS (24-48h)
- [ ] Configurar custom domain en GitHub Settings
- [ ] Agregar archivo `docs/CNAME`
- [ ] Esperar verificación de GitHub
- [ ] Habilitar "Enforce HTTPS"
- [ ] Verificar que HTTPS funciona
- [ ] Actualizar `site_url` en mkdocs.yml
- [ ] Actualizar links en documentación
- [ ] Actualizar README.md
- [ ] Comunicar cambio a usuarios

## Monitoreo

### Uptime Monitoring

Servicios gratuitos para monitorear disponibilidad:

1. **UptimeRobot** (gratis)
   - https://uptimerobot.com
   - Check cada 5 minutos
   - Alertas por email

2. **StatusCake** (gratis)
   - https://www.statuscake.com
   - Check cada 5 minutos
   - Múltiples ubicaciones

3. **Pingdom** (trial gratis)
   - https://www.pingdom.com
   - Monitoring avanzado

### Analytics

Si configuraste Google Analytics GA4 (ver [analytics-setup.md](analytics-setup.md)):

- Tráfico por URL
- Tiempo de carga por región
- Navegadores más usados
- Páginas más visitadas

## Referencias

- [GitHub Pages Custom Domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [MkDocs Configuration](https://www.mkdocs.org/user-guide/configuration/)
- [Let's Encrypt CAA](https://letsencrypt.org/docs/caa/)
- [DNS Propagation Checker](https://www.whatsmydns.net/)

## Soporte

Si encuentras problemas:

1. Revisar [GitHub Status](https://www.githubstatus.com/)
2. Verificar logs en Actions
3. Crear issue en el repositorio
4. Contactar soporte de tu proveedor DNS

---

**Última actualización:** 2025-10-04
