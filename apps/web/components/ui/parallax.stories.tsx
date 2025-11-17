import type { Meta, StoryObj } from "@storybook/react";
import { Parallax, ParallaxLayer, ParallaxImage } from "./parallax";
import { GradientMesh } from "./gradient-mesh";

const meta = {
  title: "UI/Parallax",
  component: Parallax,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Parallax>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MultiLayer: Story = {
  args: {
    children: null,
  },
  render: () => (
    <div className="relative min-h-[1400px] overflow-hidden bg-slate-950 text-white">
      <GradientMesh />
      <div className="relative mx-auto flex max-w-5xl flex-col gap-32 py-24">
        <section className="space-y-4 text-center">
          <p className="text-xs uppercase tracking-[0.45em] text-brisa-400">
            Scroll suave
          </p>
          <h2 className="text-4xl font-semibold">
            Crea profundidad en el landing sin videos pesados
          </h2>
          <p className="text-brisa-200">
            Los componentes Parallax mueven elementos a velocidades distintas.
            Ideal para hero sections, timelines o galerías.
          </p>
        </section>

        <div className="relative h-[400px] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent">
          <ParallaxImage
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1800&q=80"
            alt="Operación nocturna"
            speed={0.2}
            className="h-full w-full"
          />
          <ParallaxLayer depth={2} className="absolute inset-0">
            <div className="absolute bottom-10 left-10 rounded-2xl bg-black/50 px-6 py-4 text-sm backdrop-blur">
              Supervisión Brickell · 03:15 AM
            </div>
          </ParallaxLayer>
        </div>

        <div className="relative h-[500px]">
          <ParallaxLayer depth={1} className="absolute inset-0">
            <div className="h-full w-full rounded-3xl bg-emerald-500/20 blur-[100px]" />
          </ParallaxLayer>
          <ParallaxLayer
            depth={3}
            className="absolute inset-x-0 top-16 flex justify-center"
          >
            <div className="w-3/4 rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
              <p className="text-lg text-brisa-200">
                “Los clientes notan que la landing se siente viva. Parallax
                ayuda a contar la historia del día a día sin saturar de texto.”
              </p>
              <p className="mt-4 text-sm text-brisa-400">Equipo de producto</p>
            </div>
          </ParallaxLayer>
        </div>
      </div>
    </div>
  ),
};
