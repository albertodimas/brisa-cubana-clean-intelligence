import type { Meta, StoryObj } from "@storybook/react";
import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
  scrollVariants,
} from "./scroll-reveal";

const meta = {
  title: "UI/Scroll Reveal",
  component: ScrollReveal,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ScrollReveal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Variantes: Story = {
  args: {
    children: null,
  },
  render: () => (
    <div className="min-h-[1400px] bg-gradient-to-b from-[#030c18] via-[#041122] to-[#060d18] px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl space-y-32">
        {Object.keys(scrollVariants)
          .slice(0, 5)
          .map((variant) => (
            <ScrollReveal
              key={variant}
              variant={variant as keyof typeof scrollVariants}
              className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-8"
            >
              <p className="text-xs uppercase tracking-[0.35em] text-brisa-400">
                Variante
              </p>
              <h3 className="text-3xl font-semibold">{variant}</h3>
              <p className="text-brisa-200">
                Esta sección aparece cuando entras en el viewport. Ajusta
                `viewportMargin` y `amount` para dispararla antes o después.
              </p>
            </ScrollReveal>
          ))}

        <StaggerContainer className="grid gap-4 md:grid-cols-3">
          {["Concierge", "Night Shift", "Express"].map((label) => (
            <StaggerItem
              key={label}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <p className="text-sm uppercase tracking-[0.35em] text-brisa-400">
                Cuadrilla
              </p>
              <h4 className="text-2xl font-semibold">{label}</h4>
              <p className="text-sm text-brisa-200">
                Activa el stagger para lists o cards que deban aparecer en
                cascada.
              </p>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </div>
  ),
};
