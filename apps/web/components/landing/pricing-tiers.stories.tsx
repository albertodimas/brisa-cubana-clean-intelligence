import type { Meta, StoryObj } from "@storybook/react";
import type { Route } from "next";
import { PricingTiers, type PricingTier } from "./pricing-tiers";
import { MarketingLink } from "./marketing-link";

const tiers: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    headline: "Hasta 5 unidades",
    price: "$1,490",
    priceSuffix: "/mes",
    description: "Turnovers básicos con inventario esencial",
    features: [
      "2 turnos garantizados por semana",
      "Reportes con 20 fotos HD",
      "Soporte asíncrono en menos de 8h",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    headline: "6 a 15 unidades",
    price: "$3,950",
    priceSuffix: "/mes",
    description: "Operación coordinada con concierge y lavandería",
    highlighted: true,
    features: [
      "Cuadrillas dedicadas por zona",
      "SLA estricto de 4 horas",
      "Integración Slack + portal en vivo",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    headline: "+16 unidades y edificios completos",
    price: "Custom",
    priceSuffix: "según ocupación",
    description: "Equipo onsite, night-shift media y tablero financiero",
    features: [
      "Supervisor residente",
      "Turnos simultáneos ilimitados",
      "Cuenta estratégica y soporte 24/7",
    ],
  },
];

type PricingTiersStoryProps = {
  tiers: PricingTier[];
};

function PricingTiersStory({ tiers }: PricingTiersStoryProps) {
  return (
    <PricingTiers
      tiers={tiers}
      renderCTA={(tier) => (
        <MarketingLink
          href={"/servicios" as Route}
          eventName="cta_storybook_pricing_tier"
          metadata={{ tier: tier.id }}
          className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
            tier.highlighted
              ? "bg-[#0d2944] text-white hover:bg-[#11466d]"
              : "border border-gray-200 text-gray-900 hover:border-brisa-400"
          }`}
          onClick={(event) => event.preventDefault()}
        >
          Solicitar demo
        </MarketingLink>
      )}
    />
  );
}

const meta = {
  title: "Landing/Pricing Tiers",
  component: PricingTiersStory,
  args: {
    tiers,
  },
  parameters: {
    backgrounds: {
      default: "light",
    },
  },
} satisfies Meta<typeof PricingTiersStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SoloDosTiers: Story = {
  args: {
    tiers: tiers.slice(0, 2),
  },
};
