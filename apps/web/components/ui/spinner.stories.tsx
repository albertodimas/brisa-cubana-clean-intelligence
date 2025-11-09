import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Spinner, LoadingOverlay } from "./spinner";
import { Button } from "./button";

const meta = {
  title: "UI/Spinner",
  component: Spinner,
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

const variants: Array<React.ComponentProps<typeof Spinner>["variant"]> = [
  "default",
  "primary",
  "secondary",
  "success",
  "warning",
  "error",
  "info",
];

export const Variantes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      {variants.map((variant) => (
        <div key={variant} className="flex flex-col items-center gap-2 text-xs">
          <Spinner variant={variant} />
          <span className="text-brisa-300">{variant}</span>
        </div>
      ))}
    </div>
  ),
};

export const Tamaños: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-6">
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <div key={size} className="flex flex-col items-center gap-2 text-xs">
          <Spinner size={size} />
          <span className="text-brisa-300">{size.toUpperCase()}</span>
        </div>
      ))}
    </div>
  ),
};

function OverlayDemo() {
  const [show, setShow] = useState(false);

  return (
    <div className="relative w-full min-h-[200px] rounded-xl border border-brisa-700/30 p-6 bg-brisa-900/40">
      <p className="text-sm text-brisa-300">
        Usa overlays cuando bloquees interacciones críticas, como la generación
        de reportes o sincronización de inventario.
      </p>
      <Button
        className="mt-4"
        onClick={() => {
          setShow(true);
          setTimeout(() => setShow(false), 2000);
        }}
      >
        Simular carga
      </Button>
      {show && <LoadingOverlay message="Generando reportes..." />}
    </div>
  );
}

export const OverlayInteractivo: Story = {
  render: () => <OverlayDemo />,
};
