import { useState, type ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Progress } from "./progress";
import { Button } from "./button";

const meta = {
  title: "UI/Progress",
  component: Progress,
} satisfies Meta<typeof Progress>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Variantes: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <div className="space-y-1">
        <p className="text-sm text-brisa-300">Preparación de propiedad</p>
        <Progress value={35} showLabel />
      </div>
      <div className="space-y-1">
        <p className="text-sm text-emerald-200">Turno express</p>
        <Progress value={72} variant="success" showLabel />
      </div>
      <div className="space-y-1">
        <p className="text-sm text-amber-200">Inventario crítico</p>
        <Progress value={54} variant="warning" showLabel />
      </div>
      <div className="space-y-1">
        <p className="text-sm text-red-200">Incidencias por resolver</p>
        <Progress value={18} variant="error" showLabel />
      </div>
    </div>
  ),
};

function ProgressPlayground() {
  const [value, setValue] = useState(45);
  const currentVariant: ComponentProps<typeof Progress>["variant"] =
    value >= 80 ? "success" : value >= 50 ? "info" : "warning";

  return (
    <div className="space-y-4 max-w-md">
      <Progress value={value} showLabel variant={currentVariant} size="lg" />

      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setValue((prev) => Math.max(prev - 10, 0))}
        >
          -10%
        </Button>
        <Button
          size="sm"
          onClick={() => setValue((prev) => Math.min(prev + 10, 100))}
        >
          +10%
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setValue(45)}>
          Reset
        </Button>
      </div>

      <p className="text-xs text-brisa-400">
        Representa el avance de los entregables para la salida de beta. Manténlo
        sobre 80% para entrar a revisión GA.
      </p>
    </div>
  );
}

export const Interactivo: Story = {
  render: () => <ProgressPlayground />,
};
