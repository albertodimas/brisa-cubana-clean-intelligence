import type { Meta, StoryObj } from "@storybook/react";
import { GradientMesh, GradientOrb } from "./gradient-mesh";

const meta = {
  title: "UI/Gradient Mesh",
  component: GradientMesh,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GradientMesh>;

export default meta;

type Story = StoryObj<typeof meta>;

export const HeroBackground: Story = {
  render: () => (
    <div className="relative min-h-[500px] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#010b18] via-[#041c2f] to-[#052337] text-white p-12">
      <GradientMesh />
      <div className="relative space-y-6 max-w-2xl">
        <p className="text-xs tracking-[0.45em] uppercase text-brisa-400">
          Operación premium
        </p>
        <h2 className="text-4xl font-semibold">
          Turnovers coordinados con evidencia en tiempo real
        </h2>
        <p className="text-lg text-brisa-200/90">
          Usa el mesh como fondo de secciones hero o métricas. El efecto es
          completamente client-side y no requiere assets externos.
        </p>
      </div>
    </div>
  ),
};

export const OrbsPersonalizados: Story = {
  render: () => (
    <div className="relative min-h-[400px] rounded-3xl border border-white/10 bg-[#030c19] overflow-hidden flex items-center justify-center text-center text-white">
      <GradientOrb
        color="rgba(30,202,211,0.5)"
        size="380px"
        blur={90}
        position={{ x: "30%", y: "30%" }}
      />
      <GradientOrb
        color="rgba(244,114,182,0.45)"
        size="320px"
        blur={80}
        position={{ x: "70%", y: "60%" }}
      />
      <div className="relative space-y-3">
        <h3 className="text-2xl font-semibold">GradientOrb</h3>
        <p className="text-brisa-200">
          Ideal para acentos en tarjetas o ilustraciones sin depender de
          imágenes PNG.
        </p>
      </div>
    </div>
  ),
};
