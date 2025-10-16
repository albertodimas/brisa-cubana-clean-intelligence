import Link from "next/link";

export const metadata = {
  title: "Portal Cliente – Brisa Cubana Clean Intelligence",
  description:
    "Vista pública en construcción para que clientes consulten sus reservas y gestionen solicitudes.",
};

export default function PortalClientePage() {
  return (
    <main className="min-h-screen bg-white px-4 py-12 text-gray-900 dark:bg-brisa-950 dark:text-white sm:px-6 md:px-8">
      <div className="mx-auto grid max-w-3xl gap-6">
        <header className="space-y-3">
          <span className="text-xs uppercase tracking-[0.3em] text-brisa-500 dark:text-brisa-300">
            Portal cliente · fase 2
          </span>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            Estamos preparando tu panel de reservas
          </h1>
          <p className="max-w-[70ch] text-sm text-gray-600 dark:text-brisa-300 sm:text-base">
            Esta vista mostrará tus próximos servicios, historial y solicitudes
            de cambio en tiempo real. Mientras completamos la fase de diseño,
            puedes contactar al equipo de operaciones para ajustes urgentes.
          </p>
        </header>

        <section className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-700 dark:border-brisa-500/30 dark:bg-brisa-900/30 dark:text-brisa-200">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            ¿Qué viene en esta iteración?
          </h2>
          <ul className="mt-3 grid gap-2">
            <li>
              • Resumen de próximas reservas con estados y links a detalle.
            </li>
            <li>
              • Línea de tiempo de historial con facturas descargables en PDF.
            </li>
            <li>
              • Botón “Solicitar cambio” para reagendar o cancelar con motivos
              predefinidos.
            </li>
          </ul>
        </section>

        <footer className="text-sm text-gray-600 dark:text-brisa-300">
          Sigue el progreso en el{" "}
          <Link
            className="text-brisa-600 underline-offset-4 transition-colors hover:underline dark:text-brisa-300"
            href="https://github.com/albertodimas/brisa-cubana-clean-intelligence/blob/main/docs/product/rfc-public-components.md#81-portal-cliente"
            prefetch={false}
          >
            RFC de componentes públicos
          </Link>{" "}
          y aporta feedback desde operaciones.
        </footer>
      </div>
    </main>
  );
}
