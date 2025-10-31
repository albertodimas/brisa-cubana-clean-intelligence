import type { Meta, StoryObj } from "@storybook/react";
import { Plus } from "lucide-react";
import { Button } from "./button";
import { EmptyState } from "./empty-state";

const meta = {
  title: "UI/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "centered",
  },
  args: {
    title: "Sin resultados",
    description:
      "No encontramos registros con los filtros actuales. Ajusta los criterios o intenta una búsqueda diferente.",
    variant: "search",
  },
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithActions: Story = {
  args: {
    title: "Aún no hay leads",
    description:
      "Empieza creando un formulario o activa los canales automáticos para captar nuevos prospectos.",
    variant: "inbox",
    action: (
      <Button size="sm" className="gap-2">
        <Plus className="h-4 w-4" />
        Crear lead
      </Button>
    ),
    secondaryAction: (
      <Button variant="ghost" size="sm">
        Ver tutorial
      </Button>
    ),
  },
};

export const ErrorState: Story = {
  args: {
    title: "No pudimos cargar los datos",
    description:
      "Verifica tu conexión o inténtalo nuevamente. Si el problema persiste, revisa el monitor de incidentes.",
    variant: "error",
  },
};
