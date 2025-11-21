import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  type PageTransitionProps,
} from "./page-transition";
import { Button } from "./button";

const meta = {
  title: "UI/Page Transition",
  component: PageTransition,
} satisfies Meta<typeof PageTransition>;

export default meta;

type Story = StoryObj<typeof meta>;

const views = {
  overview: {
    title: "Resumen operativo",
    description: "Métricas clave y SLA de las últimas 24h.",
    highlights: ["97% SLA cumplido", "12 turnos activos", "3 incidencias"],
  },
  calendar: {
    title: "Calendario de turnos",
    description: "Visualiza turnos asignados por cuadrilla y prioridad.",
    highlights: [
      "Cuadrilla Norte · 4 turnos",
      "Express · 3 turnos",
      "Night shift · 2 turnos",
    ],
  },
  insights: {
    title: "Insights financieros",
    description: "Performance por Portafolio y comparativa semanal.",
    highlights: ["ADR +12%", "Upsells $3,8K", "Comisiones Stripe OK"],
  },
};

function PageTransitionPlayground() {
  const [variant, setVariant] =
    useState<PageTransitionProps["variant"]>("fade");
  const [view, setView] = useState<keyof typeof views>("overview");

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", `/storybook/${view}`);
    }
  }, []);

  const handleViewChange = (nextView: keyof typeof views) => {
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", `/storybook/${nextView}`);
    }
    setView(nextView);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 text-sm text-brisa-300">
        <div className="flex items-center gap-2">
          Vista:
          {Object.keys(views).map((key) => (
            <Button
              key={key}
              variant={view === key ? "primary" : "ghost"}
              size="sm"
              onClick={() => handleViewChange(key as keyof typeof views)}
            >
              {key}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          Variante:
          {(["fade", "slide", "scale", "blur"] as const).map((option) => (
            <Button
              key={option}
              variant={variant === option ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setVariant(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      </div>

      <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-[#050f1f] to-[#081a2f] p-6 text-white">
        <PageTransition variant={variant}>
          <section key={view} className="space-y-6">
            <FadeIn direction="up" className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-brisa-400">
                {view}
              </p>
              <h3 className="text-3xl font-semibold">{views[view].title}</h3>
              <p className="text-brisa-200">{views[view].description}</p>
            </FadeIn>
            <StaggerContainer className="grid gap-3 sm:grid-cols-3">
              {views[view].highlights.map((item) => (
                <StaggerItem
                  key={item}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-sm"
                >
                  {item}
                </StaggerItem>
              ))}
            </StaggerContainer>
          </section>
        </PageTransition>
      </div>
    </div>
  );
}

export const Playground: Story = {
  args: {
    children: null,
  },
  render: () => <PageTransitionPlayground />,
};
