import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "./label";
import { Input } from "./input";
import { Select } from "./select";

const meta = {
  title: "UI/Label",
  component: Label,
} satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Formulario: Story = {
  render: () => (
    <div className="space-y-5 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="prop-name">Nombre de la propiedad</Label>
        <Input
          id="prop-name"
          placeholder="Brickell Collection 502"
          helperText="Usa el nombre que tus operadores reconocerán fácilmente."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="turno-fecha">Fecha de turno</Label>
        <Input id="turno-fecha" type="date" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="turno-plan">Plan operativo</Label>
        <Select
          id="turno-plan"
          placeholder="Selecciona plan"
          options={[
            { value: "standard", label: "Standard (hasta 5 unidades)" },
            { value: "scale", label: "Scale (6-15 unidades)" },
            { value: "enterprise", label: "Enterprise (16+ unidades)" },
          ]}
          helperText="Determinamos SLA y cuadrillas según el plan."
        />
      </div>
    </div>
  ),
};
