import type { Meta, StoryObj } from "@storybook/react";
import { ToastProvider, useToast } from "./toast";
import { Button } from "./button";

type ToastPlaygroundProps = {
  showProgress?: boolean;
};

function ToastPlayground({ showProgress = true }: ToastPlaygroundProps) {
  const { showToast } = useToast();

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        onClick={() =>
          showToast("Inventario validado y entregado al concierge.", {
            type: "success",
            showProgress,
          })
        }
      >
        Mostrar éxito
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          showToast("No pudimos sincronizar los checklists, reintenta.", {
            type: "error",
            showProgress,
            action: {
              label: "Reintentar ahora",
              onClick: () => showToast("Sincronizando…", { type: "info" }),
            },
          })
        }
      >
        Mostrar error
      </Button>
      <Button
        variant="ghost"
        onClick={() =>
          showToast("Turno reagendado para mañana 9:00am.", {
            type: "warning",
            duration: 8000,
            showProgress,
          })
        }
      >
        Mostrar warning
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          showToast("Supervisora asignada: Carla · SLA 4h.", {
            type: "info",
            duration: 0,
            showProgress,
          })
        }
      >
        Mostrar info persistente
      </Button>
    </div>
  );
}

const meta = {
  title: "UI/Toast",
  component: ToastPlayground,
  decorators: [
    (Story) => (
      <ToastProvider>
        <div className="min-h-[240px]">
          <Story />
        </div>
      </ToastProvider>
    ),
  ],
  argTypes: {
    showProgress: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof ToastPlayground>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Variantes: Story = {};

export const SinBarraDeProgreso: Story = {
  args: {
    showProgress: false,
  },
};
