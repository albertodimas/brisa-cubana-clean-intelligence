import Link from "next/link";

const highlights = [
  {
    title: "Equipos confiables",
    description:
      "Personal operativo entrenado con protocolos de limpieza profunda, rotaciones verificadas y control de calidad documentado.",
  },
  {
    title: "Tecnología en cada visita",
    description:
      "Dashboard en tiempo real, rutas optimizadas y reportes antes/después para propiedades residenciales y renta corta.",
  },
  {
    title: "Pagos sin fricción",
    description:
      "Checkout con Stripe, recordatorios automáticos y facturación consolidada para que cierres ciclos sin hojas de cálculo.",
  },
];

const processSteps = [
  {
    step: "1",
    title: "Agenda una inspección",
    description:
      "Cuéntanos del espacio, frecuencia y servicios especiales. En menos de 24 horas recibirás una propuesta personalizada.",
  },
  {
    step: "2",
    title: "Activa tu portal",
    description:
      "Gestiona reservas, reagenda, descarga reportes y comparte accesos con tu equipo desde un solo lugar.",
  },
  {
    step: "3",
    title: "Monitorea resultados",
    description:
      "Recibe evidencias fotográficas, métricas de satisfacción y alertas proactivas previas a cada estancia.",
  },
];

const testimonials = [
  {
    quote:
      "Desde que migramos con Brisa Cubana no hemos tenido un solo check-in retrasado. La visibilidad del portal nos permite reaccionar antes de que un huésped lo note.",
    author: "Laura Méndez",
    role: "Directora de Operaciones · StayBrick Rentals",
  },
  {
    quote:
      "Cada visita viene documentada con fotos y checklist. El equipo llega puntual y deja la propiedad lista para inspección hotelera.",
    author: "Carlos Martínez",
    role: "Administrador · Residencias Brickell Loft",
  },
];

export const revalidate = 3600;

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-brisa-950 text-gray-900 dark:text-brisa-50">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brisa-100 via-white to-white dark:from-brisa-900/60 dark:via-brisa-950 dark:to-brisa-950 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          <header className="flex flex-col gap-6 lg:gap-8">
            <span className="text-xs tracking-[0.45em] uppercase text-brisa-600 dark:text-brisa-300">
              Brisa Cubana Clean Intelligence
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05] max-w-3xl">
              Limpieza hotelera para renta corta y residencias premium en Miami
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-brisa-200 max-w-2xl">
              Operamos cada propiedad con estándares cinco estrellas: equipos
              propios, tecnología en campo y reporte en tiempo real.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/checkout"
                className="inline-flex items-center justify-center rounded-full bg-brisa-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brisa-600/20 hover:bg-brisa-700 transition-colors"
              >
                Solicita una propuesta
              </Link>
              <Link
                href="/clientes"
                className="inline-flex items-center justify-center rounded-full border border-brisa-600 px-6 py-3 text-base font-semibold text-brisa-600 hover:bg-brisa-50 dark:border-brisa-300 dark:text-brisa-200 dark:hover:bg-brisa-900 transition-colors"
              >
                Explora el portal cliente
              </Link>
            </div>
          </header>
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <h2 className="text-3xl sm:text-4xl font-semibold text-center mb-12">
          ¿Por qué marcas de hospitalidad nos eligen?
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-950 p-6 shadow-sm"
            >
              <h3 className="text-xl font-semibold mb-3 text-brisa-700 dark:text-brisa-200">
                {item.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-brisa-300 leading-relaxed">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 dark:bg-brisa-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <h2 className="text-3xl sm:text-4xl font-semibold text-center mb-12">
            Un proceso diseñado para operaciones predictivas
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {processSteps.map((step) => (
              <article
                key={step.step}
                className="rounded-3xl bg-white dark:bg-brisa-950/70 border border-gray-200 dark:border-brisa-700 p-6 shadow-sm"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brisa-600 text-white font-semibold mb-4">
                  {step.step}
                </span>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-brisa-300 leading-relaxed">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <h2 className="text-3xl sm:text-4xl font-semibold text-center mb-12">
          Historias de clientes
        </h2>
        <div className="grid gap-8 lg:grid-cols-2">
          {testimonials.map((item) => (
            <blockquote
              key={item.author}
              className="relative rounded-3xl border border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-950 p-8 shadow-sm"
            >
              <span
                className="absolute -top-4 left-6 text-5xl text-brisa-200 dark:text-brisa-700"
                aria-hidden
              >
                “
              </span>
              <p className="text-base sm:text-lg text-gray-700 dark:text-brisa-200 leading-relaxed">
                {item.quote}
              </p>
              <footer className="mt-6">
                <p className="font-semibold text-brisa-700 dark:text-brisa-100">
                  {item.author}
                </p>
                <p className="text-sm text-gray-600 dark:text-brisa-300">
                  {item.role}
                </p>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="bg-brisa-50 dark:bg-brisa-900/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-semibold">
            Lleva tu operación al siguiente nivel
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-brisa-200 max-w-2xl mx-auto">
            Integración con PMS, reportes descargables y soporte 24/7. Estamos
            listos para conectar con tu equipo y diseñar un programa a la
            medida.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/checkout"
              className="inline-flex items-center justify-center rounded-full bg-brisa-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brisa-600/20 hover:bg-brisa-700 transition-colors"
            >
              Comenzar ahora
            </Link>
            <Link
              href="mailto:hola@brisacubanaclean.com"
              className="inline-flex items-center justify-center rounded-full border border-brisa-600 px-6 py-3 text-base font-semibold text-brisa-600 hover:bg-brisa-50 dark:border-brisa-300 dark:text-brisa-200 dark:hover:bg-brisa-900 transition-colors"
            >
              Habla con nuestro equipo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
