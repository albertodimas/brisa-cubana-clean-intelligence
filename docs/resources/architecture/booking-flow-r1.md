# User Flow R1 · Booking inteligente

```mermaid
flowchart TD
    A[Landing] --> B[CTA "Reserva"]
    B --> C{Agente IA solicita datos}
    C -->|Fotos/Video| D[Analiza contenido]
    D --> E[Genera estimación + tiempo]
    E --> F{Cliente confirma?}
    F -->|No| B
    F -->|Sí| G[Selecciona horario]
    G --> H[Paso de pago (Stripe Checkout)]
    H --> I[Confirmación + Resumen]
    I --> J[Creación workflow Temporal]
    J --> K[Asignar cuadrilla disponible]
    K --> L[Notificar cliente + staff]
```

> Propietario: Product Designer. Última revisión 29 sep 2025.
