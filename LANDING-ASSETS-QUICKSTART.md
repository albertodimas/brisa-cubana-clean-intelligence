# Landing Assets - Guía Rápida de Importación

**Última actualización:** 2025-10-22
**Rama:** `feat/landing-assets`

---

## ⚡ Inicio Rápido (5 minutos)

### 1. Preparar archivos originales

Crear carpeta temporal con estructura:

```bash
mkdir -p assets-input/{hero,mockups/16-9,mockups/4-5}
```

Copiar archivos originales a carpetas correspondientes:

- **Hero image** → `assets-input/hero/` (debe ser 2400×1600 o similar ratio 3:2)
- **Mockups horizontales** → `assets-input/mockups/16-9/` (deben ser 1920×1080 o ratio 16:9)
- **Mockups verticales** → `assets-input/mockups/4-5/` (deben ser 1080×1350 o ratio 4:5)

### 2. Ejecutar script de optimización

```bash
./scripts/optimize-landing-assets.sh assets-input
```

El script automáticamente:

- ✅ Convierte a WebP optimizado
- ✅ Genera variantes responsive (múltiples tamaños)
- ✅ Optimiza peso (calidad 85%)
- ✅ Coloca archivos en `apps/web/public/assets/`

### 3. Verificar resultado

```bash
# Ver archivos generados
tree apps/web/public/assets/

# Ver pesos
du -h apps/web/public/assets/hero/*
du -h apps/web/public/assets/mockups/16-9/*
du -h apps/web/public/assets/mockups/4-5/*
```

### 2.1 (Opcional) Capturar hero automáticamente

Si tienes el servidor local corriendo (`pnpm --filter @brisa/web dev`), puedes generar el screenshot base del hero con:

```bash
pnpm capture:hero
```

El archivo quedará en `assets-input/hero/hero-source.png` listo para optimizar.

### 2.2 Capturar secciones específicas (mockups)

Para obtener mockups puntuales (ej. módulo RFID, dashboard), usa el script de sección:

```bash
node scripts/capture-landing-section.mjs --selector "[data-mockup='portal']" --out mockup-portal

# Opciones útiles
--url http://localhost:3000    # URL alternativa
--padding 32                   # Padding extra alrededor del elemento
--ratio 16-9                   # Guarda directamente en assets-input/mockups/16-9
```

Los archivos se guardan en `assets-input/mockups/<ratio>/` (por defecto `raw/`). Después ejecuta `./scripts/optimize-landing-assets.sh assets-input`
para generar las variantes WebP y moverlas automáticamente a `apps/web/public/assets/mockups/...`.

### 4. Actualizar componentes React

Editar `apps/web/app/page.tsx` (o componente correspondiente):

```tsx
// Hero section
<Image
  src="/assets/hero/hero-2400w.webp"
  alt="Brisa Cubana - Professional Cleaning Services"
  width={2400}
  height={1600}
  priority
  sizes="(max-width: 768px) 768px, (max-width: 1280px) 1280px, 2400px"
/>

// Mockup horizontal
<Image
  src="/assets/mockups/16-9/mockup-dashboard-1920w.webp"
  alt="Dashboard Overview"
  width={1920}
  height={1080}
  loading="lazy"
/>

// Mockup vertical
<Image
  src="/assets/mockups/4-5/mockup-mobile-login-1080w.webp"
  alt="Mobile App - Login"
  width={1080}
  height={1350}
  loading="lazy"
/>
```

### 5. Build y test

```bash
# Build local
pnpm build

# Verificar no hay errores de assets
# Verificar pesos optimizados en output

# Test responsive (abrir en navegador)
pnpm dev
# Abrir DevTools (F12) → Device Toolbar → Probar mobile/tablet/desktop
```

### 6. Medir performance

```bash
# Lighthouse CLI (opcional)
npx lighthouse http://localhost:3000 --view

# O usar DevTools → Lighthouse tab
# Objetivo: Performance Score > 90
```

### 7. Commit y push

```bash
git add apps/web/public/assets/ apps/web/app/page.tsx
git commit -m "feat(web): add optimized landing page assets

- Hero image 2400×1600 with responsive variants
- Mockups 16:9 (dashboard, bookings, team)
- Mockups 4:5 (mobile login, services, booking)
- All assets optimized to WebP < 300KB
- Lighthouse Performance: 92/100

Related: #64"

git push origin feat/landing-assets
```

---

## 📋 Checklist Completo

### Pre-importación

- [ ] Assets originales descargados de carpeta compartida Marketing
- [ ] Verificar dimensiones mínimas (hero: 2400×1600, mockups: según specs)
- [ ] Verificar que no están corruptos (abrir en visor de imágenes)
- [ ] Renombrados según convención si es necesario

### Durante importación

- [ ] Carpeta `assets-input/` creada con estructura correcta
- [ ] Archivos originales copiados a subcarpetas
- [ ] Script `optimize-landing-assets.sh` ejecutado sin errores
- [ ] Archivos generados en `apps/web/public/assets/` verificados

### Post-importación

- [ ] Componentes React actualizados con rutas nuevas
- [ ] `pnpm build` ejecutado exitosamente
- [ ] Responsive probado en mobile (375px, 768px)
- [ ] Responsive probado en desktop (1920px, 2560px)
- [ ] Lighthouse Performance > 90
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] Assets commiteados a `feat/landing-assets`
- [ ] Issue #64 actualizado con checkmarks ✅
- [ ] PR creado hacia `main` (opcional, puede esperar más changes)

---

## 🛠️ Comandos Útiles

### Verificar dimensiones de imágenes

```bash
# Con ImageMagick
identify assets-input/hero/*.jpg

# Con file
file assets-input/hero/*.jpg
```

### Conversión manual (si script falla)

```bash
# Hero 2400w
cwebp -q 85 -resize 2400 0 original.jpg -o hero-2400w.webp

# Redimensionar con ImageMagick
convert original.jpg -resize 1920x1280 -quality 85 hero-1920.jpg
cwebp -q 85 hero-1920.jpg -o hero-1920w.webp
```

### Ver peso total de assets

```bash
du -sh apps/web/public/assets/
```

---

## 🚨 Troubleshooting

### Problema: "cwebp: command not found"

**Solución:**

```bash
sudo apt update
sudo apt install webp
```

### Problema: "convert: command not found"

**Solución:**

```bash
sudo apt install imagemagick
```

### Problema: "Asset demasiado pesado (>300KB)"

**Solución:**

```bash
# Reducir calidad de 85 a 75
cwebp -q 75 input.jpg -o output.webp

# O comprimir más agresivamente
cwebp -q 70 -m 6 input.jpg -o output.webp
```

### Problema: "Image appears pixelated on 4K displays"

**Causa:** El asset original es demasiado pequeño.

**Solución:** Solicitar a Marketing asset de mayor resolución (mínimo 2400px ancho para hero).

---

## 🎥 Vídeo B-roll nocturno

- Guardar el clip final en `apps/web/public/assets/video/night-shift.mp4` (formato H.264, bitrate ≤ 8 Mbps, duración 60–90 s, audio opcional).
- Exportar un poster en `apps/web/public/assets/video/night-shift-poster.jpg` (1080×1920, peso < 300 KB) para vistas previas y fallback.
- Comprimir con `ffmpeg` si el archivo pesa > 20 MB:

```bash
ffmpeg -i footage-original.mp4 -vf "scale=1080:-2" -c:v libx264 -preset slow -crf 20 -c:a aac night-shift.mp4
```

- Validar la integración levantando la landing (`pnpm --filter @brisa/web dev`); el componente `NightShiftMedia` detecta automáticamente el video y reemplaza el placeholder sin cambios adicionales.
- El repositorio incluye un placeholder temporal (`night-shift.mp4` y `night-shift-poster.jpg`). Sustitúyelos por el footage final antes del deploy y confirma que ya no aparece el mensaje “Placeholder”.

---

## 📚 Documentación Completa

Para detalles técnicos completos, ver:

- **Specs técnicas:** `apps/web/public/assets/README.md`
- **Workflow completo:** `docs/marketing/visual-assets-checklist.md`
- **Issues tracking:** GitHub #64 (master), #57-#61 (individuales)

---

## 💬 Contacto

**¿Assets no disponibles todavía?**

- Verificar issues #60 (guardia nocturna) y #61 (locación Deep Clean)
- Deadline coordinación: 19:00 EDT hoy (2025-10-22)
- Escalar en standup si no hay confirmación

**¿Problemas técnicos con importación?**

- Revisar logs del script de optimización
- Verificar dependencias instaladas (cwebp, ImageMagick)
- Comentar en issue #64 con detalles del error

---

**¡Listo para importar! 🚀**
