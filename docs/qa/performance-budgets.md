# Performance Budgets

Este documento define los performance budgets (límites de rendimiento) para el proyecto Brisa Cubana Clean Intelligence.

## Objetivo

Mantener una experiencia de usuario rápida y fluida estableciendo límites cuantificables para métricas clave de rendimiento.

## Monitoreo activo

- **Web Vitals en producción**: el componente `WebVitalsReporter` envía CLS, FCP, LCP, FID/INP y TTFB a Sentry como métricas agregadas (`web_vital.*`) para detectar regresiones en tiempo real.citeturn2search1turn3search6
- **Vercel Speed Insights**: la aplicación Next.js renderiza `<SpeedInsights />`, habilitando la captura automática de métricas en el dashboard de Vercel.citeturn3search7
- **Nightly Lighthouse CI**: el workflow `nightly.yml` ejecuta `lhci autorun` con los budgets definidos en este documento; si el score de Performance cae por debajo de 90 o se violan límites, la ejecución falla poniéndolo en evidencia dentro del pipeline.

## Core Web Vitals

### First Contentful Paint (FCP)

- **Límite**: ≤ 2.0s
- **Descripción**: Tiempo hasta que el primer contenido se renderiza en pantalla
- **Objetivo**: Usuario ve feedback visual rápido

### Largest Contentful Paint (LCP)

- **Límite**: ≤ 2.5s
- **Descripción**: Tiempo hasta que el contenido principal está visible
- **Objetivo**: Contenido principal carga rápido
- **Core Web Vital**: ✅

### Cumulative Layout Shift (CLS)

- **Límite**: ≤ 0.1
- **Descripción**: Estabilidad visual durante la carga
- **Objetivo**: Evitar saltos de diseño molestos
- **Core Web Vital**: ✅

### Total Blocking Time (TBT)

- **Límite**: ≤ 300ms
- **Descripción**: Tiempo total que el hilo principal está bloqueado
- **Objetivo**: Página responde rápido a interacciones

### Speed Index

- **Límite**: ≤ 3.0s
- **Descripción**: Rapidez con la que el contenido se muestra visualmente
- **Objetivo**: Percepción de carga rápida

### Time to Interactive (TTI)

- **Límite**: ≤ 3.5s
- **Descripción**: Tiempo hasta que la página es completamente interactiva
- **Objetivo**: Usuario puede interactuar pronto

### First Input Delay (FID) / Max Potential FID

- **Límite**: ≤ 130ms
- **Descripción**: Tiempo de respuesta a la primera interacción
- **Objetivo**: Feedback inmediato a clicks/taps
- **Core Web Vital**: ✅

## Resource Budgets

### Total Bundle Size

- **Límite**: ≤ 500 KB (512,000 bytes)
- **Recomendación**: ≤ 400 KB ideal

### DOM Size

- **Límite**: ≤ 1,500 elementos
- **Recomendación**: ≤ 1,200 elementos ideal

## Lighthouse Scores

### Performance

- **Mínimo**: 90/100
- **Objetivo**: 95+/100

### Accessibility

- **Mínimo**: 90/100
- **Objetivo**: 100/100

### Best Practices

- **Mínimo**: 90/100
- **Objetivo**: 100/100

### SEO

- **Mínimo**: 90/100
- **Objetivo**: 100/100

## Referencias

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)

---

**Última actualización**: 10 de octubre de 2025
