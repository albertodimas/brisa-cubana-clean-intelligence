# @brisa/ui - Design System

Paquete compartido de componentes React para **Brisa Cubana Clean Intelligence**.

## 🎯 Overview

Design system modular y reutilizable construido con React 19 y TypeScript para mantener consistencia visual y UX en toda la plataforma.

## 📦 Instalación

```bash
# En el monorepo (desde raíz)
pnpm install

# El paquete se importa como:
import { Button, Card, Badge } from "@brisa/ui";
```

## 🎨 Componentes Disponibles

### Button

Botón versátil con múltiples variantes y tamaños.

```tsx
import { Button } from "@brisa/ui";

<Button variant="primary" size="lg" onClick={handleClick}>
  Click me
</Button>

<Button variant="secondary" size="md" disabled>
  Disabled
</Button>

<Button variant="outline" size="sm">
  Small
</Button>
```

**Props:**

- `variant`: `"primary"` | `"secondary"` | `"outline"` | `"ghost"` | `"danger"`
- `size`: `"sm"` | `"md"` | `"lg"`
- `disabled`: `boolean`
- `onClick`: `() => void`
- `children`: `ReactNode`

---

### Card

Contenedor con estilos predefinidos y padding consistente.

```tsx
import { Card } from "@brisa/ui";

<Card>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>

<Card variant="elevated">
  <p>Elevated card with shadow</p>
</Card>
```

**Props:**

- `variant`: `"default"` | `"elevated"` | `"outlined"`
- `padding`: `"none"` | `"sm"` | `"md"` | `"lg"`
- `children`: `ReactNode`

---

### Badge

Etiqueta pequeña para estados, categorías o contadores.

```tsx
import { Badge } from "@brisa/ui";

<Badge color="green">Active</Badge>
<Badge color="red">Failed</Badge>
<Badge color="yellow">Pending</Badge>
<Badge color="blue">Info</Badge>
```

**Props:**

- `color`: `"green"` | `"red"` | `"yellow"` | `"blue"` | `"gray"`
- `size`: `"sm"` | `"md"`
- `children`: `ReactNode`

---

### MetricCard

Card especializado para mostrar métricas con valores y tendencias.

```tsx
import { MetricCard } from "@brisa/ui";

<MetricCard
  label="Total Revenue"
  value="$12,450.00"
  trend="+12.5%"
  trendDirection="up"
/>

<MetricCard
  label="Failed Payments"
  value="3"
  trend="-50%"
  trendDirection="down"
/>
```

**Props:**

- `label`: `string`
- `value`: `string | number`
- `trend?`: `string`
- `trendDirection?`: `"up"` | `"down"` | `"neutral"`
- `icon?`: `ReactNode`

---

### HeroSection

Sección hero reutilizable para landing pages.

```tsx
import { HeroSection } from "@brisa/ui";

<HeroSection
  title="El sistema operativo inteligente para la limpieza"
  subtitle="Tecnología premium que combina la energía cubana con la innovación de Miami"
  primaryCta={{
    label: "Agendar demo",
    href: "/demo",
  }}
  secondaryCta={{
    label: "Ver precios",
    href: "/pricing",
  }}
/>;
```

**Props:**

- `title`: `string`
- `subtitle`: `string`
- `primaryCta`: `{ label: string; href: string }`
- `secondaryCta?`: `{ label: string; href: string }`
- `backgroundImage?`: `string`

---

### StatsGrid

Grid responsive para mostrar estadísticas.

```tsx
import { StatsGrid } from "@brisa/ui";

const stats = [
  { label: "Reservas completadas", value: "1,234" },
  { label: "Clientes satisfechos", value: "456" },
  { label: "Horas de limpieza", value: "12,345" },
];

<StatsGrid stats={stats} columns={3} />;
```

**Props:**

- `stats`: `Array<{ label: string; value: string | number }>`
- `columns`: `2 | 3 | 4`

---

## 🎨 Tokens de Diseño

### Colores

```typescript
// Primary
--color-primary-50: #f0fdfa
--color-primary-500: #14b8a6
--color-primary-900: #134e4a

// Secondary
--color-secondary-50: #fdf2f8
--color-secondary-500: #ec4899
--color-secondary-900: #831843

// Neutral
--color-gray-50: #f9fafb
--color-gray-500: #6b7280
--color-gray-900: #111827
```

### Tipografía

```typescript
// Font families
--font-sans: 'Inter', system-ui, sans-serif
--font-mono: 'JetBrains Mono', monospace

// Font sizes
--text-xs: 0.75rem    // 12px
--text-sm: 0.875rem   // 14px
--text-base: 1rem     // 16px
--text-lg: 1.125rem   // 18px
--text-xl: 1.25rem    // 20px
--text-2xl: 1.5rem    // 24px
--text-3xl: 1.875rem  // 30px
--text-4xl: 2.25rem   // 36px
```

### Spacing

```typescript
--spacing-1: 0.25rem   // 4px
--spacing-2: 0.5rem    // 8px
--spacing-3: 0.75rem   // 12px
--spacing-4: 1rem      // 16px
--spacing-6: 1.5rem    // 24px
--spacing-8: 2rem      // 32px
--spacing-12: 3rem     // 48px
```

### Borders

```typescript
--border-radius-sm: 0.25rem   // 4px
--border-radius-md: 0.5rem    // 8px
--border-radius-lg: 0.75rem   // 12px
--border-radius-xl: 1rem      // 16px
```

## 🛠️ Desarrollo

### Estructura

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── MetricCard.tsx
│   │   ├── HeroSection.tsx
│   │   └── StatsGrid.tsx
│   ├── tokens/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── spacing.ts
│   ├── index.ts          # Exports públicos
│   └── types.ts          # TypeScript types
├── package.json
└── tsconfig.json
```

### Agregar Nuevo Componente

```bash
# 1. Crear archivo
touch src/components/MyComponent.tsx

# 2. Implementar componente
# src/components/MyComponent.tsx

# 3. Exportar en index.ts
# export { MyComponent } from './components/MyComponent';

# 4. Build
pnpm build
```

### Testing

```bash
# Ejecutar tests
pnpm test

# Watch mode
pnpm test:watch
```

### Build

```bash
# Build del paquete
pnpm build

# Output: dist/
```

## 📚 Storybook (Roadmap)

Documentación interactiva de componentes con Storybook 8.

```bash
# Levantar Storybook (cuando esté configurado)
pnpm storybook

# Build estático
pnpm storybook:build
```

## 🎯 Uso en Apps

### En Next.js (apps/web)

```tsx
// apps/web/src/app/page.tsx
import { HeroSection, Button, Card } from "@brisa/ui";

export default function Home() {
  return (
    <main>
      <HeroSection
        title="Bienvenido"
        subtitle="La mejor plataforma de limpieza"
        primaryCta={{ label: "Empezar", href: "/dashboard" }}
      />

      <Card>
        <h2>Nuestros servicios</h2>
        <Button variant="primary">Ver más</Button>
      </Card>
    </main>
  );
}
```

### En otros paquetes

```tsx
// packages/admin-dashboard/src/components/Dashboard.tsx
import { MetricCard, StatsGrid } from "@brisa/ui";

export function Dashboard() {
  return (
    <div>
      <MetricCard
        label="Total Revenue"
        value="$12,450"
        trend="+12.5%"
        trendDirection="up"
      />

      <StatsGrid
        stats={[
          { label: "Users", value: "1,234" },
          { label: "Revenue", value: "$45K" },
        ]}
        columns={2}
      />
    </div>
  );
}
```

## 🤝 Contribuir

1. Mantener consistencia con tokens de diseño
2. Documentar props con JSDoc
3. Escribir tests para nuevos componentes
4. Actualizar este README con ejemplos

Ver [CONTRIBUTING.md](../../CONTRIBUTING.md) para más detalles.

## 📝 Notas

- Todos los componentes son **tree-shakeable**
- TypeScript con tipos estrictos
- Zero dependencias externas (excepto React)
- Compatible con SSR (Next.js App Router)
