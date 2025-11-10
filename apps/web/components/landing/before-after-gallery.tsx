import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui";
import type { BeforeAfterScenario } from "@/lib/marketing-content";
import { SectionHeading } from "./section-heading";

type BeforeAfterGalleryProps = {
  scenarios: BeforeAfterScenario[];
};

export function BeforeAfterGallery({ scenarios }: BeforeAfterGalleryProps) {
  if (!scenarios.length) {
    return null;
  }

  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <SectionHeading
          eyebrow="Before / After"
          title="Transformamos cada espacio para que luzca cinco estrellas."
          description="Selecciona un ambiente para ver cómo combinamos protocolos Enhanced Cleaning, staging premium y QA digital."
        />

        <Tabs defaultValue={scenarios[0]?.id ?? ""} className="w-full">
          <TabsList className="flex w-full flex-wrap gap-2 rounded-2xl bg-white/70 p-2 dark:bg-brisa-900/60">
            {scenarios.map((scenario) => (
              <TabsTrigger
                key={scenario.id}
                value={scenario.id}
                className="flex-1 rounded-xl px-3 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-gray-500 data-[state=active]:bg-brisa-600 data-[state=active]:text-white sm:flex-none"
              >
                {scenario.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {scenarios.map((scenario) => (
            <TabsContent key={scenario.id} value={scenario.id} className="mt-8">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <div className="space-y-4">
                  <ScrollReveal variant="fadeUp" className="space-y-3">
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {scenario.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-brisa-200">
                      {scenario.description}
                    </p>
                  </ScrollReveal>
                  <StaggerContainer className="grid gap-3 sm:grid-cols-2">
                    {scenario.highlights.map((item) => (
                      <StaggerItem key={item}>
                        <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm dark:border-brisa-800 dark:bg-brisa-900 dark:text-brisa-100">
                          {item}
                        </div>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <figure className="rounded-2xl border border-brisa-100/80 bg-white shadow-md dark:border-brisa-800/50 dark:bg-brisa-900/60">
                    <Image
                      src={scenario.before.src}
                      alt={scenario.before.alt}
                      width={1600}
                      height={1200}
                      className="h-auto w-full object-cover"
                      sizes="(max-width: 640px) 100vw, 50vw"
                      loading="lazy"
                      placeholder={
                        scenario.before.blurDataURL ? "blur" : undefined
                      }
                      blurDataURL={scenario.before.blurDataURL}
                    />
                    <figcaption className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brisa-500 dark:text-brisa-300">
                      Antes
                    </figcaption>
                  </figure>
                  <figure className="rounded-2xl border border-brisa-100/80 bg-white shadow-lg shadow-brisa-900/10 dark:border-brisa-700/60 dark:bg-brisa-900/60">
                    <Image
                      src={scenario.after.src}
                      alt={scenario.after.alt}
                      width={1600}
                      height={1200}
                      className="h-auto w-full object-cover"
                      sizes="(max-width: 640px) 100vw, 50vw"
                      loading="lazy"
                      placeholder={
                        scenario.after.blurDataURL ? "blur" : undefined
                      }
                      blurDataURL={scenario.after.blurDataURL}
                    />
                    <figcaption className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brisa-500 dark:text-brisa-200">
                      Después
                    </figcaption>
                  </figure>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
