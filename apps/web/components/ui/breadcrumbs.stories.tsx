import type { Meta, StoryObj } from "@storybook/react";
import type { Route } from "next";
import { Breadcrumbs, type BreadcrumbItem } from "./breadcrumbs";

const baseItems: BreadcrumbItem[] = [
  { label: "Panel", href: "/panel" as Route },
  { label: "Calendario", href: "/panel/calendario" as Route },
  { label: "Turno 24-311" },
];

const meta = {
  title: "UI/Breadcrumbs",
  component: Breadcrumbs,
  args: {
    items: baseItems,
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basico: Story = {};

export const SinHome: Story = {
  args: {
    showHome: false,
  },
};

export const SeparadorPersonalizado: Story = {
  args: {
    separator: <span className="text-brisa-500">/</span>,
    items: [
      { label: "Panel", href: "/panel" as Route },
      { label: "Servicios", href: "/panel/servicios" as Route },
      { label: "Turnos recurrentes", href: "/panel/servicios/turnos" as Route },
      { label: "Setup fin de año" },
    ],
  },
};
