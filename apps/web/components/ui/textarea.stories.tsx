import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./textarea";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basico: Story = {
  render: () => (
    <Textarea
      label="Notas internas"
      placeholder="Detalla hallazgos, estado del inventario o instrucciones adicionales…"
      helperText="Visible solo para operaciones."
    />
  ),
};

export const ConError: Story = {
  render: () => (
    <Textarea
      label="Plan de mitigación"
      placeholder="Describe la acción propuesta."
      error="Describe al menos 20 caracteres para registrar el incidente."
      value=""
      required
    />
  ),
};

export const ConContador: Story = {
  render: () => {
    const [value, setValue] = useState(
      "El concierge requiere acceso anticipado.",
    );
    return (
      <Textarea
        label="Mensaje al propietario"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        maxLength={160}
        showCharCount
        helperText="Este mensaje se enviará por email y WhatsApp."
      />
    );
  },
};
