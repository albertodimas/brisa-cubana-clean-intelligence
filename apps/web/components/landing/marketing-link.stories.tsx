import type { Meta, StoryObj } from "@storybook/react";
import type { Route } from "next";
import { MarketingLink } from "./marketing-link";

function MarketingLinkPreview() {
  const logClick = (payload: Record<string, unknown>) => {
    console.info("marketing-link-click", payload);
  };

  return (
    <div className="space-y-3 text-sm text-white">
      <MarketingLink
        href={"/servicios" as Route}
        eventName="cta_storybook_contacto"
        metadata={{ plan: "premium", channel: "storybook" }}
        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 font-semibold text-white transition hover:bg-white/20"
        onClick={(event) => {
          event.preventDefault();
          logClick({
            eventName: "cta_storybook_contacto",
            metadata: { plan: "premium", channel: "storybook" },
          });
        }}
      >
        Hablar con operaciones →
      </MarketingLink>

      <MarketingLink
        href={"/soporte" as Route}
        eventName="cta_storybook_servicios"
        metadata={{ page: "landing", slot: "hero_secondary" }}
        className="inline-flex items-center gap-1 text-brisa-200 underline underline-offset-4 hover:text-white"
        onClick={(event) => {
          event.preventDefault();
          logClick({
            eventName: "cta_storybook_servicios",
            metadata: { page: "landing", slot: "hero_secondary" },
          });
        }}
      >
        Ver servicios detallados
      </MarketingLink>

      <MarketingLink
        href={"/terminos" as Route}
        eventName="cta_storybook_pricing"
        metadata={{ locale: "es-ES", experiment: "pricing-highlight" }}
        className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
        onClick={(event) => {
          event.preventDefault();
          logClick({
            eventName: "cta_storybook_pricing",
            metadata: { locale: "es-ES", experiment: "pricing-highlight" },
          });
        }}
      >
        Explorar planes operativos
      </MarketingLink>
    </div>
  );
}

const meta = {
  title: "Landing/Marketing Link",
  component: MarketingLinkPreview,
} satisfies Meta<typeof MarketingLinkPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
