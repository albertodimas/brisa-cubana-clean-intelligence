# Google Analytics Setup

Guía para configurar Google Analytics 4 (GA4) en la documentación de MkDocs.

## Prerrequisitos

- Cuenta de Google Analytics
- Acceso al proyecto en Google Cloud Console
- Permisos de administrador en el repositorio

## Pasos de Configuración

### 1. Crear Propiedad GA4

1. Accede a [Google Analytics](https://analytics.google.com/)
2. Click en **Admin** (engranaje inferior izquierdo)
3. En la columna **Account**, selecciona o crea una cuenta
4. En la columna **Property**, click en **Create Property**
5. Completa los datos:
   - **Property name:** `Brisa Cubana Docs`
   - **Reporting time zone:** `(GMT-05:00) Eastern Time`
   - **Currency:** `United States Dollar (USD)`
6. Click en **Next** y completa la información del negocio
7. Click en **Create**

### 2. Obtener Measurement ID

Una vez creada la propiedad:

1. En **Admin** > **Property** > **Data Streams**
2. Click en **Add stream** > **Web**
3. Ingresa la URL: `https://albertodimas.github.io/brisa-cubana-clean-intelligence/`
4. Nombre del stream: `GitHub Pages Docs`
5. Click en **Create stream**
6. **Copia el Measurement ID** (formato: `G-XXXXXXXXXX`)

### 3. Configurar en el Proyecto

#### Opción A: Variable de Entorno (Recomendado)

```bash
# En .env (local)
GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
```

#### Opción B: Hardcodeado en mkdocs.yml

```yaml
# mkdocs.yml
extra:
  analytics:
    provider: google
    property: G-XXXXXXXXXX # Reemplaza con tu ID real
```

### 4. Configurar en GitHub Secrets (CI/CD)

Para que funcione en GitHub Actions:

1. Ve a: `Settings` > `Secrets and variables` > `Actions`
2. Click en **New repository secret**
3. Nombre: `GOOGLE_ANALYTICS_ID`
4. Value: `G-XXXXXXXXXX` (tu Measurement ID)
5. Click en **Add secret**

### 5. Actualizar Workflow de Deployment

Edita [.github/workflows/docs-deploy.yml](../../.github/workflows/docs-deploy.yml):

```yaml
- name: Build documentation
  env:
    GOOGLE_ANALYTICS_ID: ${{ secrets.GOOGLE_ANALYTICS_ID }}
  run: |
    # Reemplazar placeholder con ID real
    sed -i "s/G-XXXXXXXXXX/${GOOGLE_ANALYTICS_ID}/g" mkdocs.yml
    mkdocs build --strict
```

### 6. Verificar Instalación

1. Deploy a GitHub Pages
2. Visita https://albertodimas.github.io/brisa-cubana-clean-intelligence/
3. En GA4, ve a **Reports** > **Realtime**
4. Deberías ver tu visita en tiempo real

### 7. (Opcional) Configurar Goals & Conversions

Métricas sugeridas para rastrear:

- **Búsquedas en docs:** Event `search`
- **Páginas más visitadas:** Page views
- **Tiempo en página:** Engagement time
- **Scroll depth:** Scroll percentage
- **Enlaces externos:** Outbound clicks

## Dashboards Sugeridos

### Dashboard de Uso de Docs

Métricas clave:

- Total de usuarios únicos
- Páginas por sesión
- Bounce rate
- Top 10 páginas más visitadas
- Búsquedas más comunes
- Geografía de visitantes
- Dispositivos (mobile/desktop)

### Crear Dashboard

1. En GA4, ve a **Explore** > **Blank exploration**
2. Nombre: `Docs Usage Dashboard`
3. Añade métricas:
   - **Users**
   - **Sessions**
   - **Page views**
   - **Average engagement time**
4. Dimensiones:
   - **Page title**
   - **Country**
   - **Device category**
5. Guarda y comparte con el equipo

## Privacidad y GDPR

⚠️ **Importante:** Google Analytics rastrea usuarios. Considera:

1. **Añadir banner de consentimiento:**
   - Plugin MkDocs: [mkdocs-privacy](https://squidfunk.github.io/mkdocs-material/setup/ensuring-data-privacy/)

2. **Configurar anonimización de IP:**

   ```yaml
   extra:
     analytics:
       provider: google
       property: G-XXXXXXXXXX
       anonymize_ip: true
   ```

3. **Actualizar Privacy Policy:**
   - Mencionar uso de GA4
   - Link a política de Google
   - Opción de opt-out

## Troubleshooting

### No aparecen datos en GA4

1. Verifica que el Measurement ID sea correcto
2. Revisa que el script esté inyectado en el HTML:
   ```bash
   curl https://albertodimas.github.io/brisa-cubana-clean-intelligence/ | grep "G-"
   ```
3. Chequea la consola del navegador (Network tab)
4. Espera 24-48h para datos históricos (Realtime es inmediato)

### Error en build de MkDocs

Si el build falla después de configurar GA4:

```bash
# Verificar sintaxis de mkdocs.yml
mkdocs build --strict --verbose
```

## Referencias

- [MkDocs Material Analytics](https://squidfunk.github.io/mkdocs-material/setup/setting-up-site-analytics/)
- [GA4 Documentation](https://support.google.com/analytics/answer/9304153)
- [GA4 Setup Guide](https://support.google.com/analytics/answer/9304153)
- [Privacy & GDPR](https://squidfunk.github.io/mkdocs-material/setup/ensuring-data-privacy/)

---

**Última actualización:** 2025-10-04
