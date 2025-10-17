# Assets Públicos – Componentes Fase 2

**Última actualización:** 17 de octubre de 2025
**Propósito:** Capturas de referencia visual para layouts de landing, checkout y portal cliente documentados en [RFC](../../product/rfc-public-components.md).

---

## 📋 Archivos Actuales

| Archivo                | Dimensiones | Estado         | Descripción            | Última exportación |
| ---------------------- | ----------- | -------------- | ---------------------- | ------------------ |
| `landing-desktop.png`  | 1×1         | ⏸️ Placeholder | Hero + servicios + CTA | 17-oct-2025        |
| `checkout-flow.png`    | 1×1         | ⏸️ Placeholder | Flujo completo 3 pasos | 17-oct-2025        |
| `portal-dashboard.png` | 1×1         | ⏸️ Placeholder | Dashboard con métricas | 17-oct-2025        |

> **Nota:** Los archivos actuales son placeholders de 1×1px. Reemplazar con exportaciones reales de Figma siguiendo el procedimiento descrito abajo.

---

## 🎨 Procedimiento de Exportación desde Figma

### Requisitos previos

- Acceso al proyecto Figma "Brisa · Público"
- Permisos de exportación de frames
- Navegador actualizado (Chrome/Firefox)

### Pasos para exportar

#### 1. Preparación en Figma

1. Abrir el archivo de diseño en Figma
2. Navegar a la página correspondiente
3. Seleccionar el frame completo a exportar (clic en el panel izquierdo o sobre el frame en el canvas)

#### 2. Configurar parámetros de exportación

**Para desktop (1440px):**

```
Panel derecho → "Export" → "+ Add export settings"
- Format: PNG
- Size: 2x (retina)
- Suffix: -desktop (opcional, renombrar después)
Click "Export [nombre-frame]"
```

**Para mobile (768px o 375px):**

```
Seleccionar frame mobile correspondiente
- Format: PNG
- Size: 2x
- Suffix: -mobile
```

#### 3. Optimización de imágenes

Después de exportar, optimizar tamaño de archivo:

```bash
# Opción A: pngquant (reducción con pérdida aceptable)
pngquant --quality=80-95 --ext .png --force landing-desktop.png

# Opción B: optipng (sin pérdida)
optipng -o5 landing-desktop.png
```

**Objetivo:** < 500KB por imagen desktop, < 200KB por imagen mobile.

#### 4. Reemplazar placeholders

```bash
# Desde raíz del repositorio
cd docs/assets/public-components/

# Copiar archivos exportados
cp ~/Downloads/Landing-2x.png landing-desktop.png
cp ~/Downloads/Checkout-2x.png checkout-flow.png
cp ~/Downloads/Portal-2x.png portal-dashboard.png

# Verificar
file *.png && du -h *.png
```

#### 5. Actualizar tabla de seguimiento

Editar este README y actualizar la tabla de §1:

```markdown
| `landing-desktop.png` | 1440×2800 | ✅ Actual | Hero + servicios + CTA | 2025-10-17 |
```

Cambiar estado: ⏸️ Placeholder → ✅ Actual

---

## 🔍 Validación Post-Exportación

### Checklist de calidad

- [ ] Dimensiones correctas (1440px ancho desktop, 768px ancho mobile)
- [ ] Tamaño de archivo < 500KB (desktop) / < 200KB (mobile)
- [ ] Formato PNG con transparencia preservada (si aplica)
- [ ] Legibilidad de textos y elementos UI
- [ ] Colores consistentes con paleta de diseño
- [ ] No hay elementos cortados o fuera de marco

### Comandos de verificación

```bash
# Ver metadatos
file landing-desktop.png
# Salida esperada: PNG image data, 1440 x N, 8-bit/color RGB

# Ver tamaño
du -h landing-desktop.png
# Salida esperada: ~450K o menos
```

---

## 📝 Notas de Mantenimiento

### Convenciones de nomenclatura

- **Formato:** PNG a 1440px (desktop) y 768px (mobile)
- **Nombres:** `<page>-<variant>.png` (ej. `landing-desktop.png`)
- **Origen:** Exportar desde Figma "Brisa · Público" usando slices etiquetados

### Frecuencia de actualización

- **Landing:** Actualizar cuando cambien elementos visuales principales
- **Checkout:** Actualizar ante cambios en flujo o formularios
- **Portal:** Actualizar mensualmente o ante cambios en dashboard

### Versionado

Si se necesita mantener versiones históricas:

```
landing-desktop-2025-10-17.png
landing-desktop-2025-11-15.png  # Nueva versión
```

Mantener solo las últimas 2-3 versiones.

---

## 📎 Referencias

- [RFC Componentes Públicos](../../product/rfc-public-components.md)
- [Roadmap Fase 2](../../product/phase-2-roadmap.md)

---

**Mantenido por:** Equipo de Producto + QA
