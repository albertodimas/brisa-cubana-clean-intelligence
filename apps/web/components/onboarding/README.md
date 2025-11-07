# Sistema de Onboarding

Sistema completo de tours guiados y onboarding para nuevos usuarios.

## Componentes

### OnboardingTour

Componente principal para crear tours guiados interactivos.

#### Características

- ✨ **Spotlight dinámico** - Resalta elementos específicos de la UI
- 🎯 **Posicionamiento inteligente** - Top, bottom, left, right, center
- 📊 **Progress bar animado** - Muestra el progreso del tour
- 💾 **Persistencia automática** - Usa localStorage para trackear completitud
- 📱 **Completamente responsive** - Adaptado para móvil y desktop
- ♿ **Accesible** - Roles ARIA y navegación por teclado

#### Uso básico

```tsx
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";

const steps = [
  {
    id: "welcome",
    title: "¡Bienvenido!",
    description: "Esta es una introducción rápida",
    position: "center", // Sin elemento target
  },
  {
    id: "filters",
    title: "Usar Filtros",
    description: "Encuentra lo que necesitas aquí",
    target: "#filters", // Selector CSS
    position: "bottom",
  },
];

function MyPage() {
  return (
    <>
      {/* Tu contenido */}
      <OnboardingTour
        tourId="my-feature"
        steps={steps}
        onComplete={() => console.log("Tour completado!")}
        onSkip={() => console.log("Tour omitido")}
      />
    </>
  );
}
```

#### Props

| Prop         | Tipo         | Descripción                  |
| ------------ | ------------ | ---------------------------- |
| `steps`      | `TourStep[]` | Array de pasos del tour      |
| `tourId`     | `string`     | ID único para persistencia   |
| `onComplete` | `() => void` | Callback al completar        |
| `onSkip`     | `() => void` | Callback al omitir           |
| `isActive`   | `boolean`    | Control manual de activación |

#### TourStep

```typescript
type TourStep = {
  id: string; // ID único del paso
  title: string; // Título del paso
  description: string; // Descripción detallada
  target?: string; // Selector CSS del elemento (opcional)
  position?: "top" | "bottom" | "left" | "right" | "center";
  onComplete?: () => void; // Callback al completar este paso
};
```

### useOnboarding Hook

Hook para controlar el estado del tour programáticamente.

```tsx
import { useOnboarding } from "@/components/onboarding/onboarding-tour";

function MyComponent() {
  const { isCompleted, shouldShowTour, reset } = useOnboarding("my-tour");

  return (
    <div>
      {shouldShowTour && <OnboardingTour tourId="my-tour" steps={steps} />}

      {isCompleted && <button onClick={reset}>Ver tour nuevamente</button>}
    </div>
  );
}
```

#### Returns

- `isCompleted` - Si el tour fue completado
- `shouldShowTour` - Si se debe mostrar el tour (!isCompleted)
- `reset()` - Función para resetear el estado del tour

## Ejemplos implementados

### CalendarTour

Tour guiado específico para el calendario de reservas.

```tsx
import { CalendarTour } from "@/components/calendar/calendar-tour";

// Uso automático (se muestra a usuarios nuevos)
<CalendarTour />

// Uso con callbacks
<CalendarTour
  onComplete={() => {
    console.log("Usuario completó el tour del calendario");
  }}
  isActive={showTour}
/>
```

**Pasos del tour:**

1. Bienvenida general
2. Explicación de filtros
3. Toggle de vistas (mensual/semanal)
4. Interacción con reservas
5. Drag & drop para reprogramar

## Creando tu propio tour

### 1. Define los pasos

```tsx
const myTourSteps: TourStep[] = [
  {
    id: "intro",
    title: "¡Bienvenido!",
    description: "Esta es la descripción del primer paso",
    position: "center",
  },
  {
    id: "feature-1",
    title: "Función importante",
    description: "Aquí puedes hacer X, Y, Z",
    target: "#important-button",
    position: "bottom",
  },
];
```

### 2. Agrega IDs/aria-labels a tus elementos

```tsx
// En tu componente
<div id="important-button">
  <button aria-label="Acción importante">Click me</button>
</div>

// O usa selectores más específicos
<div className="filters-section">
  {/* target: ".filters-section" */}
</div>
```

### 3. Crea el componente de tour

```tsx
// components/my-feature/my-feature-tour.tsx
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";

export function MyFeatureTour() {
  return (
    <OnboardingTour
      tourId="my-feature-v1"
      steps={myTourSteps}
      onComplete={() => {
        // Analytics, etc.
      }}
    />
  );
}
```

### 4. Integra en tu página

```tsx
import { MyFeatureTour } from "./my-feature-tour";

export function MyFeaturePage() {
  return (
    <div>
      {/* Tu contenido */}

      {/* Tour - se muestra automáticamente a usuarios nuevos */}
      <MyFeatureTour />
    </div>
  );
}
```

## Personalización avanzada

### Posicionamiento dinámico

El componente ajusta automáticamente la posición basado en:

- Posición del elemento target
- Tamaño de la ventana
- Scroll del usuario

### Animaciones

Usa Framer Motion para transiciones suaves:

- Fade in/out del overlay
- Scale in del spotlight
- Slide in del tooltip
- Progress bar animado

### Estilo

Personaliza con Tailwind classes:

```tsx
// En onboarding-tour.tsx, modifica las clases
<motion.div
  className={cn(
    "bg-white dark:bg-brisa-900", // Tus colores
    "rounded-xl shadow-2xl",      // Tus sombras
    "border border-gray-200",     // Tus bordes
    className
  )}
>
```

## Best Practices

### ✅ DO

- Mantén los pasos cortos (3-5 pasos ideal)
- Usa descripciones concisas pero informativas
- Agrega IDs semánticos a elementos importantes
- Testea en mobile y desktop
- Permite a usuarios omitir el tour
- Usa `tourId` descriptivos (ej: `calendar-v1`, no `tour1`)

### ❌ DON'T

- No hagas tours de más de 7 pasos
- No uses selectores CSS frágiles (`.button-1234`)
- No fuerces el tour sin opción de omitir
- No uses el mismo `tourId` para diferentes tours
- No asumas que elementos existen (maneja casos donde `target` no se encuentra)

## Persistencia

Los tours usan localStorage con la clave:

```
onboarding-{tourId}-completed = "true"
```

Para limpiar manualmente:

```tsx
localStorage.removeItem("onboarding-calendar-main-completed");
```

## Debugging

### Tour no se muestra

1. Verifica que `tourId` sea único
2. Chequea localStorage en DevTools
3. Asegúrate que elementos `target` existan en el DOM
4. Verifica que no esté marcado como completado

```tsx
// En console
localStorage.getItem("onboarding-my-tour-completed"); // null = no completado
```

### Elemento no se resalta

1. Verifica el selector CSS del `target`
2. Asegúrate que el elemento esté visible (no `display: none`)
3. Chequea que el elemento tenga dimensiones (`width`, `height`)

```tsx
// Testear selector
document.querySelector("#my-element"); // Debe retornar el elemento
```

## Analytics

Trackea eventos importantes:

```tsx
<OnboardingTour
  tourId="my-feature"
  steps={steps}
  onComplete={() => {
    // Analytics
    analytics.track("Tour Completed", {
      tourId: "my-feature",
      timestamp: new Date(),
    });
  }}
  onSkip={() => {
    analytics.track("Tour Skipped", {
      tourId: "my-feature",
      step: currentStep,
    });
  }}
/>
```

## Contribuir

Para agregar nuevas features al sistema de onboarding:

1. Actualiza `OnboardingTour` component
2. Documenta en este README
3. Agrega ejemplos en Storybook (si está disponible)
4. Testea en diferentes viewports
