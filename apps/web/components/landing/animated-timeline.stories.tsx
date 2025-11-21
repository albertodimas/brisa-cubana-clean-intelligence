import type { Meta, StoryObj } from "@storybook/react";
import {
  CalendarRange,
  ClipboardCheck,
  PackageCheck,
  Sparkles,
} from "lucide-react";
import { AnimatedTimeline } from "./animated-timeline";

const baseItems = [
  {
    title: "Diagnóstico operativo",
    description:
      "Recopilamos SLA actuales, accesos, turnos críticos y fotos de referencia en menos de 48h.",
    icon: CalendarRange,
  },
  {
    title: "Checklist personalizado",
    description:
      "Convertimos tu playbook en tareas accionables con evidencias obligatorias y asignamos cuadrillas.",
    icon: ClipboardCheck,
  },
  {
    title: "Night shift media",
    description:
      "Documentamos cada turno con video/foto HD y subimos el reporte al portal en tiempo real.",
    icon: Sparkles,
  },
  {
    title: "Inventario repuesto",
    description:
      "Re-stock de amenities y kits aprobados, cargados en la bitácora con responsables y facturas.",
    icon: PackageCheck,
  },
];

const meta = {
  title: "Landing/Animated Timeline",
  component: AnimatedTimeline,
  args: {
    items: baseItems,
  },
} satisfies Meta<typeof AnimatedTimeline>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Vertical: Story = {};

export const Horizontal: Story = {
  args: {
    orientation: "horizontal",
  },
};
