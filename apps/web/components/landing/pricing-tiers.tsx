export type PricingTier = {
  id: string;
  name: string;
  headline: string;
  price: string;
  priceSuffix: string;
  description: string;
  features: string[];
  highlighted?: boolean;
};

type PricingTiersProps = {
  tiers: PricingTier[];
  renderCTA?: (tier: PricingTier) => React.ReactNode;
};

export function PricingTiers({ tiers, renderCTA }: PricingTiersProps) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <div className="flex flex-col gap-4 text-center mb-12">
        <span className="text-xs tracking-[0.45em] uppercase text-brisa-600 dark:text-brisa-300">
          Planes y precios
        </span>
        <h2 className="text-3xl sm:text-4xl font-semibold">
          Ajustados al ritmo operativo de tu portafolio
        </h2>
        <p className="text-base sm:text-lg text-gray-600 dark:text-brisa-300 max-w-3xl mx-auto">
          Selecciona un paquete según la cantidad de unidades y frecuencia de
          turnos. Todos incluyen supervisión onsite, reportes con evidencias y
          acceso al portal cliente.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {tiers.map((tier) => (
          <article
            key={tier.id}
            className={`rounded-3xl border shadow-sm p-7 sm:p-8 flex flex-col gap-6 ${
              tier.highlighted
                ? "border-brisa-500 bg-white dark:bg-brisa-900/70 dark:border-brisa-400"
                : "border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-950/80"
            }`}
          >
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-wide text-brisa-600 dark:text-brisa-300">
                {tier.name}
              </p>
              <h3 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-brisa-50">
                {tier.headline}
              </h3>
              <p className="text-sm text-gray-600 dark:text-brisa-300">
                {tier.description}
              </p>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold text-gray-900 dark:text-brisa-50">
                {tier.price}
              </span>
              <span className="text-sm sm:text-base text-gray-600 dark:text-brisa-300">
                {tier.priceSuffix}
              </span>
            </div>

            <ul className="space-y-3 text-sm sm:text-base text-gray-700 dark:text-brisa-100">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brisa-600 text-white text-xs font-semibold"
                  >
                    ✓
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {renderCTA ? <div>{renderCTA(tier)}</div> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
