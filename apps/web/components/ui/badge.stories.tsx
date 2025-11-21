import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ShieldCheck, Zap, Activity } from "lucide-react";
import { Badge } from "./badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

const variants: Array<React.ComponentProps<typeof Badge>["variant"]> = [
  "default",
  "secondary",
  "success",
  "warning",
  "error",
  "info",
  "outline",
  "ghost",
];

export const Variantes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {variants.map((variant) => (
        <Badge key={variant} variant={variant}>
          {variant}
        </Badge>
      ))}
    </div>
  ),
};

export const ConIconos: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="success" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
        QA aprobado
      </Badge>
      <Badge variant="info" icon={<Zap className="h-3.5 w-3.5" />}>
        Turno express
      </Badge>
      <Badge variant="warning" icon={<Activity className="h-3.5 w-3.5" />}>
        SLA ajustado
      </Badge>
    </div>
  ),
};

function ClosableBadgesDemo() {
  const [filters, setFilters] = useState([
    "Brickell Collection",
    "Turnos nocturnos",
    "Concierge Miami",
  ]);

  if (filters.length === 0) {
    return (
      <p className="text-sm text-brisa-300">
        No hay filtros activos. Activa alguno desde el panel.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Badge
          key={filter}
          variant="outline"
          onClose={() =>
            setFilters((prev) => prev.filter((item) => item !== filter))
          }
        >
          {filter}
        </Badge>
      ))}
    </div>
  );
}

export const Filtrable: Story = {
  render: () => <ClosableBadgesDemo />,
};
