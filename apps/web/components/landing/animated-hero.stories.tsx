import type { Meta, StoryObj } from "@storybook/react";
import type { Route } from "next";
import { AnimatedHero } from "./animated-hero";
import { MarketingLink } from "../landing/marketing-link";

const heroActions = (
  <>
    <MarketingLink
      href={"/servicios" as Route}
      eventName="storybook_cta_diagnostico"
      className="inline-flex items-center justify-center rounded-full bg-[#0d2944] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-[#0d294433] transition hover:-translate-y-0.5 hover:bg-[#11466d]"
    >
      Solicitar diagnóstico
    </MarketingLink>
    <MarketingLink
      href={"/soporte" as Route}
      eventName="storybook_cta_servicios"
      className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-base font-semibold text-white/80 hover:border-white"
    >
      Ver servicios
    </MarketingLink>
  </>
);

const heroVisual = (
  <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 text-white shadow-2xl shadow-black/40">
    <p className="text-sm uppercase tracking-[0.45em] text-brisa-300">
      Operación en vivo
    </p>
    <div className="mt-4 space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <span>Turnos activos</span>
        <strong className="text-lg">12</strong>
      </div>
      <div className="flex items-center justify-between">
        <span>SLA cumplido</span>
        <strong className="text-lg">97%</strong>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-brisa-200">
        Próximo turno: Brickell Collection · Check-in 3:00 PM · Supervisor:
        Carla
      </div>
    </div>
  </div>
);

const meta = {
  title: "Landing/AnimatedHero",
  component: AnimatedHero,
  args: {
    subtitle: "Operaciones premium",
    title: "Turnovers documentados en menos de 4 horas",
    description:
      "Cuadrillas dedicadas, evidencia fotográfica y portal 24/7 para hosts y property managers con SLA estrictos.",
    actions: heroActions,
    visual: heroVisual,
  },
} satisfies Meta<typeof AnimatedHero>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const StaticBackground: Story = {
  args: {
    animatedGradient: false,
  },
};
