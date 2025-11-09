import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox, CheckboxGroup, type CheckboxProps } from "./checkbox";

type CheckboxStoryProps = Omit<CheckboxProps, "checked" | "onChange"> & {
  defaultChecked?: boolean;
};

function CheckboxPreview({
  defaultChecked = false,
  ...props
}: CheckboxStoryProps) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <Checkbox
      {...props}
      checked={checked}
      onChange={(event) => setChecked(event.target.checked)}
    />
  );
}

const meta = {
  title: "UI/Checkbox",
  component: CheckboxPreview,
  args: {
    label: "Enviar resumen diario",
    description: "Recibirás un correo con las incidencias más importantes.",
    defaultChecked: true,
  },
} satisfies Meta<typeof CheckboxPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = {
  args: {
    error: "Debes aceptar los términos para continuar.",
    defaultChecked: false,
  },
};

export const Indeterminate: Story = {
  args: {
    indeterminate: true,
    defaultChecked: true,
  },
};

export const CheckboxGroupStory: Story = {
  render: () => {
    const [selected, setSelected] = useState<string[]>(["ops"]);

    const toggle = (value: string, isChecked: boolean) => {
      setSelected((prev) =>
        isChecked ? [...prev, value] : prev.filter((item) => item !== value),
      );
    };

    return (
      <CheckboxGroup
        label="Alertas"
        description="Elige los canales donde quieres recibir notificaciones"
      >
        <Checkbox
          label="Operaciones"
          description="Turnos, asignaciones y SLA críticos"
          checked={selected.includes("ops")}
          onChange={(event) => toggle("ops", event.target.checked)}
        />
        <Checkbox
          label="Finanzas"
          description="Facturas, pagos pendientes y conciliaciones"
          checked={selected.includes("finance")}
          onChange={(event) => toggle("finance", event.target.checked)}
        />
        <Checkbox
          label="Seguridad"
          description="Accesos irregulares o cambios en MFA"
          checked={selected.includes("security")}
          onChange={(event) => toggle("security", event.target.checked)}
        />
      </CheckboxGroup>
    );
  },
};
