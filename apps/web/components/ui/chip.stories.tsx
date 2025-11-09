import type { Meta, StoryObj } from "@storybook/react";
import { Chip } from "./chip";

const meta = {
  title: "UI/Chip",
  component: Chip,
} satisfies Meta<typeof Chip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Tonos: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Chip>Check-in 3:00 PM</Chip>
      <Chip tone="accent">SLA 4h</Chip>
      <Chip>Cuadrilla Norte</Chip>
      <Chip tone="accent">Concierge onsite</Chip>
    </div>
  ),
};

export const Listado: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-brisa-200">
        <Chip tone="accent">Brickell</Chip>
        <span>Turnos premium · 8 unidades</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-brisa-200">
        <Chip>Soporte 24/7</Chip>
        <span>Respuesta garantizada en 5 min.</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-brisa-200">
        <Chip tone="accent">Night shift media</Chip>
        <span>Verifica que los assets estén cargados.</span>
      </div>
    </div>
  ),
};
