import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./dialog";
import { Button } from "./button";

type DialogStoryProps = {
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showClose?: boolean;
};

function DialogPreview({ size = "md", showClose = true }: DialogStoryProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary">Abrir diálogo</Button>
      </DialogTrigger>
      <DialogContent size={size} showClose={showClose}>
        <DialogHeader>
          <DialogTitle>Confirmar inspección</DialogTitle>
          <DialogDescription>
            Supervisaremos la propiedad y cargaremos evidencia en el portal.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm text-brisa-200">
          <p>
            Coordinaremos con tu concierge y notificaremos en cuanto el
            checklist se complete. También podemos enviar un resumen por
            WhatsApp.
          </p>
          <ul className="list-disc pl-5 text-brisa-300">
            <li>Inventario listo para 6 unidades</li>
            <li>Tiempo estimado: 2h 15min</li>
            <li>Supervisor asignado: Carla</li>
          </ul>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => setOpen(false)}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const meta = {
  title: "UI/Dialog",
  component: DialogPreview,
} satisfies Meta<typeof DialogPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Fullscreen: Story = {
  args: {
    size: "full",
    showClose: false,
  },
};
