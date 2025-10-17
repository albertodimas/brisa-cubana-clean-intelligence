# Integración con Figma

**Estado:** ✅ Configurado
**Última actualización:** 17 de octubre de 2025

---

## Resumen

Integración con Figma API para automatizar la exportación de assets de diseño al repositorio.

**Comando:**

```bash
pnpm figma:export
```

---

## Configuración Inicial

### 1. Crear cuenta Figma

1. Regístrate en [Figma](https://www.figma.com) (gratis)
2. Crea un nuevo archivo de diseño o usa uno existente

### 2. Obtener Personal Access Token

1. Ve a **Settings → Account → Personal Access Tokens**
2. Click **Generate new token**
3. Dale un nombre descriptivo: `Brisa Cubana CLI Export`
4. Copia el token (solo se muestra una vez)

**URL directa:** https://www.figma.com/developers/api#access-tokens

### 3. Obtener File Key

La File Key está en la URL de tu archivo Figma:

```
https://www.figma.com/file/abc123xyz/Design-File-Name
                            ^^^^^^^^^
                            File Key
```

Ejemplo:

- **URL completa:** `https://www.figma.com/file/K9Xu2wZ3mT4vLp8qR1nY5e/Brisa-Cubana-Design-System`
- **File Key:** `K9Xu2wZ3mT4vLp8qR1nY5e`

### 4. Configurar variables de entorno

Agrega a tu `.env.local`:

```bash
FIGMA_ACCESS_TOKEN="figd_your_token_here"
FIGMA_FILE_KEY="K9Xu2wZ3mT4vLp8qR1nY5e"
```

**IMPORTANTE:**

- ❌ **NUNCA** commitees `.env.local` al repositorio
- ✅ Solo configura tokens en tu máquina local
- ✅ Los tokens son secretos personales (como contraseñas)

---

## Estructura del archivo Figma

El script busca **nodos específicos** en tu archivo Figma basándose en sus nombres.

### Nombres configurados (edítalo en `scripts/figma/export-assets.ts`)

```typescript
const ASSET_NODES = {
  "hero-background": "Hero Background Image",
  "cta-illustration": "CTA Illustration",
  "features-icon": "Features Icon Set",
};
```

### Cómo organizar tu diseño en Figma

1. **Crea un Frame** para cada asset que quieras exportar
2. **Nómbralo exactamente** como aparece en `ASSET_NODES`
3. El script buscará recursivamente en todo el archivo

**Ejemplo de estructura:**

```
📄 Brisa Cubana Design System
  📁 Pages
    📁 Public Components
      🖼️ Hero Background Image       ← Se exporta
      🖼️ CTA Illustration            ← Se exporta
      🖼️ Features Icon Set           ← Se exporta
      🖼️ Logo Variants               ← Se ignora (no está configurado)
```

---

## Uso

### Exportar assets

```bash
pnpm figma:export
```

**Salida esperada:**

```
🎨 Exportando assets desde Figma...

📂 Obteniendo estructura del archivo Figma...
✅ Archivo: Brisa Cubana Design System
   Última modificación: 2025-10-17T10:30:00Z

📦 Encontrados 3 assets para exportar

🖼️  Solicitando URLs de exportación...
⬇️  Descargando imágenes...

   → hero-background@2x.png
     ✓ Optimizado con pngquant
   → cta-illustration@2x.png
     ✓ Optimizado con pngquant
   → features-icon@2x.png
     ✓ Optimizado con pngquant

✅ Exportación completada!
📁 Assets guardados en: docs/assets/public-components
```

### Resultados

Las imágenes se guardan en:

```
docs/assets/public-components/
├── hero-background@2x.png       (2x para pantallas retina)
├── cta-illustration@2x.png
└── features-icon@2x.png
```

---

## Optimización de imágenes

El script optimiza automáticamente con **pngquant** (si está instalado).

### Instalar pngquant (opcional pero recomendado)

**Ubuntu/Debian:**

```bash
sudo apt install pngquant
```

**macOS:**

```bash
brew install pngquant
```

**Beneficios:**

- Reduce tamaño de archivos 50-70%
- Mantiene calidad visual (80-95%)
- Mejora tiempos de carga en producción

---

## Configuración avanzada

### Cambiar formato de exportación

Edita `scripts/figma/export-assets.ts`:

```typescript
const images = await client.fileImages(FIGMA_FILE_KEY, {
  ids: nodeIds,
  format: "jpg", // 'png', 'jpg', 'svg', 'pdf'
  scale: 3, // 1, 2, 3, 4 (para retina displays)
});
```

### Agregar nuevos assets

1. **En Figma:** Crea un Frame con un nombre descriptivo
2. **En código:** Agrega el nombre a `ASSET_NODES`

```typescript
const ASSET_NODES = {
  "hero-background": "Hero Background Image",
  "cta-illustration": "CTA Illustration",
  "features-icon": "Features Icon Set",
  "testimonial-photos": "Customer Testimonials", // ← Nuevo
};
```

3. **Ejecuta:** `pnpm figma:export`

---

## Solución de problemas

### Error: FIGMA_ACCESS_TOKEN no configurado

```
❌ Error: FIGMA_ACCESS_TOKEN no configurado
   Configura tu token en .env.local
```

**Solución:**

1. Genera token en Figma Settings
2. Agrégalo a `.env.local`
3. Reinicia el comando

---

### Error: 403 Forbidden

```
❌ Error: 403 Forbidden
   Verifica que tu FIGMA_ACCESS_TOKEN sea válido
```

**Solución:**

- Token expirado o revocado → Genera uno nuevo
- Token mal copiado → Verifica que incluye `figd_`

---

### Error: 404 Not Found

```
❌ Error: 404 Not Found
   Verifica que FIGMA_FILE_KEY sea correcto
```

**Solución:**

- Copia la File Key directamente de la URL de Figma
- Asegúrate de tener acceso al archivo (no privado de otro equipo)

---

### ⚠️ No se encontraron nodos para exportar

```
⚠️  No se encontraron nodos para exportar
   Verifica los nombres en ASSET_NODES
```

**Solución:**

1. Abre tu archivo Figma
2. Verifica que los Frames tengan **exactamente** los nombres configurados
3. Los nombres son **case-sensitive** (`Hero Background` ≠ `hero background`)

---

## Workflow recomendado

### 1. Diseñar en Figma

- Crea componentes visuales
- Organiza en Frames nombrados
- Mantén consistencia con design system

### 2. Exportar al repositorio

```bash
pnpm figma:export
```

### 3. Usar en código

```tsx
import Image from "next/image";

export function HeroSection() {
  return (
    <Image
      src="/docs/assets/public-components/hero-background@2x.png"
      alt="Hero background"
      width={1920}
      height={1080}
    />
  );
}
```

### 4. Re-exportar cuando cambien los diseños

Cada vez que actualices diseños en Figma:

```bash
pnpm figma:export
```

---

## Limitaciones conocidas

- ⚠️ **Solo exporta PNG/JPG/SVG:** No exporta componentes de código
- ⚠️ **Nombres exactos:** Los nombres en Figma deben coincidir exactamente
- ⚠️ **Rate limits:** Figma API tiene límites de 1000 requests/hora
- ⚠️ **Tamaño máximo:** Imágenes grandes (>4096px) pueden fallar

---

## Alternativas

Si prefieres exportar manualmente sin CLI:

1. **Exportación manual desde Figma:**
   - Selecciona Frame → File → Export → 2x PNG
   - Guarda en `docs/assets/public-components/`

2. **Plugins de Figma:**
   - [Figma to Code](https://www.figma.com/community/plugin/842128343887142055/Figma-to-Code)
   - [HTML to Figma](https://www.figma.com/community/plugin/1159123024924461424/HTML-to-Figma)

3. **Figma API directamente:**
   - [Documentación oficial](https://www.figma.com/developers/api)

---

## Referencias

- **Figma API Docs:** https://www.figma.com/developers/api
- **figma-js GitHub:** https://github.com/figma/figma-api-demo
- **Script fuente:** `scripts/figma/export-assets.ts`
- **Assets destino:** `docs/assets/public-components/`

---

**Mantenido por:** Alberto Dimas
**Última auditoría:** 17 de octubre de 2025
