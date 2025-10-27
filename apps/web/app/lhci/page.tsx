import type { Metadata } from "next";
import {
  GradientMesh,
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "LHCI Snapshot · Brisa Cubana",
  description:
    "Página dedicada para auditorías Lighthouse: sin autenticación y con contenido estático representativo.",
};

export default function LhciPage() {
  return (
    <main className="relative min-h-screen bg-brisa-900 text-brisa-100 flex flex-col items-center justify-center gap-6 p-6 overflow-hidden">
      {/* Gradient Mesh Background */}
      <GradientMesh
        colors={{
          primary: "rgba(20, 184, 166, 0.25)",
          secondary: "rgba(139, 92, 246, 0.2)",
          accent: "rgba(6, 182, 212, 0.25)",
        }}
        opacity={0.25}
        shimmer
      />

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-xl">
        <ScrollReveal variant="fadeDown" delay={0.1}>
          <h1 className="text-3xl font-semibold">Auditoría de Rendimiento</h1>
        </ScrollReveal>

        <ScrollReveal variant="fadeIn" delay={0.2}>
          <p className="max-w-xl text-center text-brisa-200">
            Esta vista incluye contenido representativo del panel operativo para
            mediciones Lighthouse sin necesidad de autenticación. No contiene
            datos sensibles y puede cachearse libremente.
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid gap-4 w-full" staggerDelay={0.1}>
          <StaggerItem>
            <article className="ui-panel-surface ui-panel-surface--muted">
              <h2 className="text-xl font-medium mb-2">Indicadores clave</h2>
              <ul className="list-disc list-inside text-sm text-brisa-200">
                <li>Tiempo de respuesta API &lt; 350&nbsp;ms</li>
                <li>Disponibilidad semanal ≥ 99.5&nbsp;%</li>
                <li>Backlog de notificaciones críticas en cero</li>
              </ul>
            </article>
          </StaggerItem>

          <StaggerItem>
            <article className="ui-panel-surface ui-panel-surface--muted">
              <h2 className="text-xl font-medium mb-2">Próximos hitos</h2>
              <ol className="list-decimal list-inside text-sm text-brisa-200">
                <li>Conectar stream SSE con bus de eventos en tiempo real.</li>
                <li>
                  Extender cobertura end-to-end a flujos de reclutamiento.
                </li>
                <li>Optimizar payload crítico para First Contentful Paint.</li>
              </ol>
            </article>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </main>
  );
}
