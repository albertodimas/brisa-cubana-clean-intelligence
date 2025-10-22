# Landing Page Assets - Especificaciones Técnicas

**Última actualización:** 2025-10-22
**Rama:** `feat/landing-assets`
**Responsable:** Marketing + Desarrollo

---

## Estructura de Carpetas

```
apps/web/public/assets/
├── hero/           # Hero image principal (above the fold)
├── mockups/
│   ├── 16-9/       # Mockups horizontales (desktop/tablet)
│   └── 4-5/        # Mockups verticales (mobile/stories)
└── README.md       # Este archivo
```

---

## 1. Hero Image (Above the Fold)

### Especificaciones Técnicas

| Atributo        | Valor                      |
| --------------- | -------------------------- |
| **Dimensiones** | 2400×1600 px (ratio 3:2)   |
| **Formato**     | WebP (fallback: JPG)       |
| **Peso máximo** | 300 KB (optimizado)        |
| **Calidad**     | 85% (balance calidad/peso) |
| **Responsive**  | Sí, con srcset múltiple    |

### Variantes Requeridas

```
hero-2400w.webp    # Desktop XL (2400×1600)
hero-1920w.webp    # Desktop L  (1920×1280)
hero-1280w.webp    # Tablet     (1280×853)
hero-768w.webp     # Mobile     (768×512)
```

### Uso en Código

```tsx
<Image
  src="/assets/hero/hero-2400w.webp"
  alt="Brisa Cubana - Professional Cleaning Services"
  width={2400}
  height={1600}
  priority
  sizes="(max-width: 768px) 768px,
         (max-width: 1280px) 1280px,
         (max-width: 1920px) 1920px,
         2400px"
  srcSet="/assets/hero/hero-768w.webp 768w,
          /assets/hero/hero-1280w.webp 1280w,
          /assets/hero/hero-1920w.webp 1920w,
          /assets/hero/hero-2400w.webp 2400w"
/>
```

### Criterios de Calidad

- ✅ Iluminación profesional (no subexpuesta ni quemada)
- ✅ Composición con espacio para texto overlay (regla de tercios)
- ✅ Colores vibrantes pero naturales (no over-saturados)
- ✅ Nitidez alta en punto focal
- ✅ Sin ruido visible en zonas oscuras

---

## 2. Mockups 16:9 (Horizontal)

### Especificaciones Técnicas

| Atributo        | Valor                                           |
| --------------- | ----------------------------------------------- |
| **Dimensiones** | 1920×1080 px (Full HD)                          |
| **Formato**     | WebP (fallback: PNG si necesita transparencias) |
| **Peso máximo** | 200 KB por mockup                               |
| **Cantidad**    | 3-5 mockups                                     |
| **Uso**         | Features section, carousel desktop              |

### Variantes por Mockup

```
mockup-dashboard-1920w.webp     # Desktop
mockup-dashboard-1280w.webp     # Tablet
mockup-dashboard-768w.webp      # Mobile (opcional)
```

### Contenido Sugerido

1. **Dashboard Overview** - Vista general del panel de control
2. **Booking Management** - Gestión de reservas
3. **Team View** - Vista de equipo y asignaciones
4. **Service Details** - Detalle de servicio específico
5. **Reports** - Reportes y analytics (opcional)

### Criterios de Calidad

- ✅ Screenshots reales del sistema (no mockups ficticios)
- ✅ Datos de demo realistas (no "Lorem Ipsum")
- ✅ UI limpia sin elementos de debug
- ✅ Estados coherentes (fechas, nombres consistentes)
- ✅ Recortes precisos sin bordes innecesarios

---

## 3. Mockups 4:5 (Vertical)

### Especificaciones Técnicas

| Atributo        | Valor                                 |
| --------------- | ------------------------------------- |
| **Dimensiones** | 1080×1350 px (Instagram Post)         |
| **Formato**     | WebP (fallback: PNG)                  |
| **Peso máximo** | 150 KB por mockup                     |
| **Cantidad**    | 3-4 mockups                           |
| **Uso**         | Mobile showcase, social media teasers |

### Variantes por Mockup

```
mockup-mobile-app-1080w.webp    # Original
mockup-mobile-app-540w.webp     # Thumbnail
```

### Contenido Sugerido

1. **Mobile Login** - Pantalla de login mobile
2. **Service Selection** - Selección de servicios mobile
3. **Booking Confirmation** - Confirmación de reserva
4. **Profile View** - Vista de perfil (opcional)

### Criterios de Calidad

- ✅ Screenshots mobile reales (simulador iOS/Android)
- ✅ Aspect ratio correcto (no estirado)
- ✅ Mockup device frame opcional (iPhone/Pixel)
- ✅ Fondo limpio (blanco/gradient suave)

---

## 4. Proceso de Importación

### Checklist de Preparación

**Antes de importar:**

- [ ] Todos los archivos nombrados según convención: `BrisaCubana_Asset-Description_V001_YYYYMMDD.ext`
- [ ] Dimensiones verificadas con herramienta (ImageMagick, Photoshop, etc.)
- [ ] Pesos optimizados (Squoosh.app, TinyPNG, etc.)
- [ ] Formatos WebP generados + fallbacks
- [ ] Assets revisados en dispositivos reales (mobile/tablet/desktop)

**Durante importación:**

1. Copiar archivos a carpetas correspondientes
2. Renombrar según patrón: `hero-{width}w.webp`, `mockup-{name}-{width}w.webp`
3. Actualizar componentes React con rutas nuevas
4. Ejecutar `pnpm build` para verificar optimización Next.js
5. Probar responsive en DevTools (F12 → Device Toolbar)

**Después de importar:**

- [ ] Lighthouse score > 90 en Performance
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] Hero image carga en < 1s en 3G Fast
- [ ] Todas las variantes responsive funcionando
- [ ] Actualizar issue #64 con checkmarks ✅

---

## 5. Herramientas Recomendadas

### Optimización de Imágenes

```bash
# Convertir JPG a WebP optimizado
cwebp -q 85 hero-original.jpg -o hero-2400w.webp

# Redimensionar con ImageMagick
convert hero-2400w.webp -resize 1920x1280 hero-1920w.webp
convert hero-2400w.webp -resize 1280x853 hero-1280w.webp
convert hero-2400w.webp -resize 768x512 hero-768w.webp

# Verificar dimensiones
identify hero-*.webp
```

### Alternativas GUI

- **Squoosh.app** - Optimización online by Google
- **TinyPNG** - Compresión PNG/JPG
- **Photoshop** - Export for Web (Save for Web legacy)
- **GIMP** - Alternativa open-source

---

## 6. Nomenclatura Final en Repo

### Hero

```
/apps/web/public/assets/hero/
├── hero-2400w.webp    (original, 2400×1600)
├── hero-1920w.webp    (large, 1920×1280)
├── hero-1280w.webp    (medium, 1280×853)
└── hero-768w.webp     (small, 768×512)
```

### Mockups 16:9

```
/apps/web/public/assets/mockups/16-9/
├── mockup-dashboard-1920w.webp
├── mockup-dashboard-1280w.webp
├── mockup-bookings-1920w.webp
├── mockup-bookings-1280w.webp
├── mockup-team-1920w.webp
└── mockup-team-1280w.webp
```

### Mockups 4:5

```
/apps/web/public/assets/mockups/4-5/
├── mockup-mobile-login-1080w.webp
├── mockup-mobile-login-540w.webp
├── mockup-mobile-services-1080w.webp
├── mockup-mobile-services-540w.webp
├── mockup-mobile-booking-1080w.webp
└── mockup-mobile-booking-540w.webp
```

---

## 7. Testing Checklist

### Performance

- [ ] Lighthouse Performance Score > 90
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] Total image weight < 1 MB (todas las variantes)

### Responsive

- [ ] Mobile (375px) - hero visible sin crop extraño
- [ ] Tablet (768px) - mockups legibles
- [ ] Desktop (1920px) - hero full-width sin pixelar
- [ ] 4K (3840px) - no se ve borroso

### Cross-Browser

- [ ] Chrome/Edge (Blink)
- [ ] Firefox (Gecko)
- [ ] Safari (WebKit)

---

## 8. Contacto y Escalación

**Responsables:**

- **Assets originales:** Marketing (issues #57, #58, #59)
- **Optimización técnica:** Desarrollo
- **Aprobación final:** Product Owner

**Escalación si bloqueado:**

1. Verificar issue #64 (master tracking)
2. Comentar en issue específico (#60, #61)
3. Mencionar en standup diario
4. Slack: #todo-brisa-cubana

---

**Última revisión:** 2025-10-22
**Próxima revisión:** Al completar importación de assets
