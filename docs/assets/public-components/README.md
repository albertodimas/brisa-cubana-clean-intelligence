# Assets Públicos – Componentes Fase 2

**Última actualización:** 17 de octubre de 2025
**Propósito:** Capturas de referencia visual para layouts de landing, checkout y portal cliente documentados en [RFC](../../product/rfc-public-components.md).

**🎨 Integración Figma:** ✅ Configurada con exportación CLI automatizada
**Guía completa:** [docs/guides/figma-integration.md](../guides/figma-integration.md)
**Comando:** `pnpm figma:export`

---

## 📋 Archivos Actuales

| Archivo                | Dimensiones | Estado         | Descripción            | Última exportación |
| ---------------------- | ----------- | -------------- | ---------------------- | ------------------ |
| `landing-desktop.png`  | 1×1         | ⏸️ Placeholder | Hero + servicios + CTA | 17-oct-2025        |
| `checkout-flow.png`    | 1×1         | ⏸️ Placeholder | Flujo completo 3 pasos | 17-oct-2025        |
| `portal-dashboard.png` | 1×1         | ⏸️ Placeholder | Dashboard con métricas | 17-oct-2025        |

> **Nota:** Los archivos actuales son placeholders de 1×1px. Reemplazar con exportaciones reales de Figma siguiendo el procedimiento descrito abajo.

---

## 🎨 Exportación Automatizada desde Figma

### Método Recomendado: CLI (Automatizado)

**Guía completa:** [docs/guides/figma-integration.md](../guides/figma-integration.md)

#### Setup inicial (una vez)

1. **Configura credenciales** en `.env.local`:

   ```bash
   FIGMA_ACCESS_TOKEN="figd_your_token_here"
   FIGMA_FILE_KEY="K9Xu2wZ3mT4vLp8qR1nY5e"
   ```

2. **Organiza diseños en Figma** con nombres específicos:
   - Frame: "Hero Background Image"
   - Frame: "CTA Illustration"
   - Frame: "Features Icon Set"

#### Exportar assets (cada vez que cambien diseños)

```bash
pnpm figma:export
```

**Resultado:**

- ✅ Descarga automática de PNG 2x (retina)
- ✅ Optimización con pngquant
- ✅ Guardado en `docs/assets/public-components/`

#### Personalizar exports

Edita `scripts/figma/export-assets.ts`:

```typescript
const ASSET_NODES = {
  "landing-hero": "Landing Hero Section", // ← Personaliza nombres
  "checkout-step1": "Checkout Step 1",
};
```

---

### Método Alternativo: Exportación Manual

Si prefieres no usar CLI, sigue el procedimiento manual:

#### 1. Preparación en Figma

1. Abrir archivo de diseño
2. Seleccionar frame a exportar
3. Panel derecho → "Export" → PNG, 2x, Export

#### 2. Optimización local

```bash
pngquant --quality=80-95 --ext .png --force landing-desktop.png
```

#### 3. Copiar al repositorio

```bash
cp ~/Downloads/Landing-2x.png docs/assets/public-components/landing-desktop.png
```

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
