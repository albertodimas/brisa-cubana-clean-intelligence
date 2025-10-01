import { redirect } from "next/navigation";
import { Badge, Button, Card, Section } from "@brisa/ui";
import { auth } from "@/server/auth/config";
import { Sparkles, Clock, DollarSign, CheckCircle2 } from "lucide-react";
import type { Service } from "@/types/api";

async function getServices(accessToken: string): Promise<Service[]> {
  const API_BASE_URL =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001";

  const response = await fetch(`${API_BASE_URL}/api/services`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch services");
  }

  return response.json();
}

const currencyFormatter = new Intl.NumberFormat("es-US", {
  style: "currency",
  currency: "USD",
});

export default async function ServicesPage() {
  const session = await auth();

  if (!session?.user || !session.user.accessToken) {
    redirect("/auth/signin");
  }

  const services = await getServices(session.user.accessToken);
  const activeServices = services.filter((s) => s.active);

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-16 text-neutral-100">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-teal-300">
          Brisa Cubana · Servicios
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">
          Catálogo de Servicios
        </h1>
        <p className="text-sm text-neutral-400">
          Servicios profesionales optimizados para CleanScore™ y auditorías IA
        </p>
      </div>

      <Section
        title={`${activeServices.length} Servicios Disponibles`}
        description="Todos nuestros servicios incluyen crews certificados y reporte CleanScore™"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          {activeServices.map((service) => (
            <Card
              key={service.id}
              className="group relative overflow-hidden transition hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-900/20"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-teal-400" />
                    <h3 className="font-semibold text-white text-lg">
                      {service.name}
                    </h3>
                  </div>
                  <Badge tone="teal" className="mt-2">
                    Activo
                  </Badge>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-teal-300">
                    {currencyFormatter.format(parseFloat(service.basePrice))}
                  </span>
                  <p className="text-xs text-neutral-500 mt-1">Precio base</p>
                </div>
              </div>

              {service.description && (
                <p className="mt-4 text-sm text-neutral-300 leading-relaxed">
                  {service.description}
                </p>
              )}

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <Clock className="h-4 w-4 text-teal-500" />
                  <span>{service.duration} minutos</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <DollarSign className="h-4 w-4 text-teal-500" />
                  <span>Precio flexible</span>
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-teal-500/5 border border-teal-500/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300 mb-2">
                  Incluye
                </p>
                <ul className="space-y-2 text-sm text-neutral-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-teal-400 mt-0.5 flex-shrink-0" />
                    <span>Crew certificado con background check</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-teal-400 mt-0.5 flex-shrink-0" />
                    <span>Reporte CleanScore™ con fotos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-teal-400 mt-0.5 flex-shrink-0" />
                    <span>Productos eco-friendly premium</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-teal-400 mt-0.5 flex-shrink-0" />
                    <span>Garantía de satisfacción 100%</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 flex gap-2">
                <Button
                  intent="primary"
                  as="a"
                  href={`/dashboard?service=${service.id}`}
                  className="flex-1"
                >
                  Agendar ahora
                </Button>
                <Button
                  intent="ghost"
                  as="a"
                  href={`/dashboard/services/${service.id}`}
                >
                  Ver detalles
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Card
        title="¿Necesitas un servicio personalizado?"
        description="Nuestro equipo puede crear un plan a medida para propiedades especiales"
        className="bg-gradient-to-br from-teal-900/20 to-teal-800/10 border-teal-500/30"
      >
        <div className="mt-6 flex gap-3">
          <Button
            intent="primary"
            as="a"
            href="mailto:hola@brisacubanaclean.com?subject=Servicio%20Personalizado"
          >
            Contactar al equipo
          </Button>
          <Button intent="ghost" as="a" href="/docs/01-vision-estrategia">
            Ver capacidades
          </Button>
        </div>
      </Card>

      <div className="flex justify-center">
        <Button intent="ghost" as="a" href="/dashboard">
          ← Volver al Dashboard
        </Button>
      </div>
    </section>
  );
}
