import type { Meta, StoryObj } from "@storybook/react";
import {
  ScrollProgress,
  ScrollProgressCircle,
  ScrollProgressWithPercentage,
} from "./scroll-progress";

function LongContent() {
  return (
    <div className="min-h-[200vh] bg-gradient-to-b from-brisa-950 via-brisa-900 to-brisa-950 text-brisa-200">
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-20">
        <h2 className="text-3xl font-semibold text-white">
          Informe operacional
        </h2>
        {Array.from({ length: 24 }).map((_, index) => (
          <p key={index} className="text-sm leading-relaxed">
            {index + 1}. Registro de turno para Brickell Collection — checklist
            completo, evidencia cargada en portal y SLA confirmado.
          </p>
        ))}
      </div>
    </div>
  );
}

const meta = {
  title: "UI/ScrollProgress",
  component: ScrollProgress,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ScrollProgress>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TopBar: Story = {
  render: () => (
    <>
      <ScrollProgress />
      <LongContent />
    </>
  ),
};

export const BottomGlow: Story = {
  render: () => (
    <>
      <ScrollProgress position="bottom" glow color="rgb(14,165,233)" />
      <LongContent />
    </>
  ),
};

export const CircleIndicator: Story = {
  render: () => (
    <>
      <ScrollProgressCircle />
      <LongContent />
    </>
  ),
};

export const PercentageBadge: Story = {
  render: () => (
    <>
      <ScrollProgressWithPercentage />
      <LongContent />
    </>
  ),
};
