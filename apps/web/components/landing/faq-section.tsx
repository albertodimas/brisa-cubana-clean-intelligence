type FAQItem = {
  question: string;
  answer: string;
};

type FAQSectionProps = {
  title?: string;
  subtitle?: string;
  items: FAQItem[];
};

export function FAQSection({
  title = "Preguntas frecuentes",
  subtitle = "Contexto operativo, tiempos de respuesta y lo que necesitas para arrancar.",
  items,
}: FAQSectionProps) {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <div className="text-center mb-12 space-y-4">
        <span className="text-xs tracking-[0.45em] uppercase text-brisa-600 dark:text-brisa-300">
          FAQ
        </span>
        <h2 className="text-3xl sm:text-4xl font-semibold">{title}</h2>
        <p className="text-base sm:text-lg text-gray-600 dark:text-brisa-300 max-w-3xl mx-auto">
          {subtitle}
        </p>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-brisa-800 rounded-3xl border border-gray-200 dark:border-brisa-800 bg-white dark:bg-brisa-950 shadow-sm">
        {items.map((item, index) => (
          <details
            key={item.question}
            className="group"
            data-testid="faq-item"
            {...(index === 0 ? { open: true } : {})}
          >
            <summary className="flex items-center justify-between gap-6 cursor-pointer px-6 sm:px-8 py-5 sm:py-6 text-left">
              <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-brisa-50">
                {item.question}
              </span>
              <span
                aria-hidden
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 dark:border-brisa-600 text-gray-600 dark:text-brisa-200 text-xs font-semibold transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <div className="px-6 sm:px-8 pb-6 text-sm sm:text-base text-gray-600 dark:text-brisa-200 leading-relaxed">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
