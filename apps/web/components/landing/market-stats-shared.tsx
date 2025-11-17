export type StatDescriptor = {
  id: string;
  description: string;
};

export const SNAPSHOT_STATS: StatDescriptor[] = [
  { id: "occupancy_rate", description: "Ocupación promedio anual" },
  { id: "adr_miami", description: "Tarifa diaria media (ADR) en Miami" },
  { id: "active_listings", description: "Listados activos en el mercado STR" },
  { id: "total_visitors", description: "Visitantes totales durante 2024" },
];

export const HIGHLIGHT_STATS = [
  {
    id: "turnovers_per_property",
    heading: "Rotaciones por propiedad",
    body: "Media anual en STR de EE. UU.; planificamos buffers para temporadas pico sin afectar revenue.",
  },
  {
    id: "review_impact_cleaning",
    heading: "Impacto en reseñas",
    body: "Los viajeros priorizan limpieza impecable; integrar QA reduce cancelaciones y mejora ratings.",
  },
  {
    id: "occupancy_rate",
    heading: "Programación garantizada",
    prefixText: "24/7",
    body: "Disponibilidad continua con equipo en guardia, portal de cliente y alertas en tiempo real.",
  },
  {
    id: "active_listings",
    heading: "Mercado Miami",
    body: "Inventario activo al cierre de Q3 2025; coordinamos lanzamientos con foco en stays back-to-back.",
  },
];

export function formatLastUpdated(value?: string) {
  if (!value) return "Fecha no disponible";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Fecha no disponible";
  }
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}
