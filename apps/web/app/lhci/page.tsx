export const metadata = {
  title: "LHCI Snapshot",
  description:
    "Página dedicada para auditorías Lighthouse: sin autenticación y con contenido estático representativo.",
};

export default function LhciPage() {
  return (
    <main className="min-h-screen bg-brisa-900 text-brisa-100 flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-semibold">Auditoría de Rendimiento</h1>
      <p className="max-w-xl text-center text-brisa-200">
        Esta vista incluye contenido representativo del panel operativo para
        mediciones Lighthouse sin necesidad de autenticación. No contiene datos
        sensibles y puede cachearse libremente.
      </p>
      <section className="grid gap-4 max-w-xl w-full">
        <article className="ui-panel-surface ui-panel-surface--muted">
          <h2 className="text-xl font-medium mb-2">Indicadores clave</h2>
          <ul className="list-disc list-inside text-sm text-brisa-200">
            <li>Tiempo de respuesta API &lt; 350&nbsp;ms</li>
            <li>Disponibilidad semanal ≥ 99.5&nbsp;%</li>
            <li>Backlog de notificaciones críticas en cero</li>
          </ul>
        </article>
        <article className="ui-panel-surface ui-panel-surface--muted">
          <h2 className="text-xl font-medium mb-2">Próximos hitos</h2>
          <ol className="list-decimal list-inside text-sm text-brisa-200">
            <li>Conectar stream SSE con bus de eventos en tiempo real.</li>
            <li>Extender cobertura end-to-end a flujos de reclutamiento.</li>
            <li>Optimizar payload crítico para First Contentful Paint.</li>
          </ol>
        </article>
      </section>
    </main>
  );
}
