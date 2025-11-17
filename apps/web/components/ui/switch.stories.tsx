import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Switch, type SwitchProps } from "./switch";

type SwitchStoryProps = Omit<SwitchProps, "checked" | "onCheckedChange"> & {
  defaultChecked?: boolean;
};

function SwitchPreview({ defaultChecked = false, ...props }: SwitchStoryProps) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <Switch
      {...props}
      checked={checked}
      onCheckedChange={(next) => setChecked(next)}
    />
  );
}

const meta = {
  title: "UI/Switch",
  component: SwitchPreview,
  args: {
    label: "Alertas push",
    description: "Activa las notificaciones en tiempo real del portal",
    defaultChecked: true,
  },
} satisfies Meta<typeof SwitchPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultChecked: false,
    description: "Disponible sólo para cuentas enterprise",
  },
};

export const LargeSwitch: Story = {
  args: {
    size: "lg",
    defaultChecked: true,
    description: "Modo supervisor con permisos extendidos",
  },
};
