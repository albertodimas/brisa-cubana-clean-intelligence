import type { Meta, StoryObj } from "@storybook/react";
import { PricingCard3D } from "./pricing-card-3d";
import { MarketingLink } from "./marketing-link";

const meta = {
  title: "Landing/Pricing Card 3D",
  component: PricingCard3D,
  args: {
    name: "Night Shift Premium",
    description:
      "Turnos nocturnos con supervisor onsite, evidencia audiovisual y reposición de amenities.",
    price: "$6,900",
    priceSuffix: "/mes",
    features: [
      "Cuadrilla dedicada + concierge",
      "Dashboard financiero en vivo",
      "Night shift media 4K + reportes",
      "Reposición automática de kits",
    ],
    cta: (
      <MarketingLink
        href="/?plan=turnover#contacto"
        eventName="storybook_pricing_card_cta"
        metadata={{ tier: "night-shift-premium" }}
        className="inline-flex w-full items-center justify-center rounded-xl bg-brisa-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brisa-400"
      >
        Solicitar demo
      </MarketingLink>
    ),
    highlighted: true,
    badge: "Más solicitado",
  },
} satisfies Meta<typeof PricingCard3D>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Destacado: Story = {};

export const Básico: Story = {
  args: {
    name: "Express Turnover",
    description: "Limpieza y staging same-day para portfolios pequeños.",
    price: "$1,490",
    highlighted: false,
    badge: undefined,
    features: [
      "2 turnos garantizados/semana",
      "Checklist digital + fotos",
      "Soporte asíncrono 12h",
    ],
  },
};
