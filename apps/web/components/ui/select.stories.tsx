import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "./select";

const options = [
  { value: "turnover", label: "Turnover Premium" },
  { value: "deep-clean", label: "Deep Clean" },
  { value: "post-construction", label: "Post-Construcción", disabled: true },
];

const meta: Meta<typeof Select> = {
  title: "UI/Select",
  component: Select,
  args: {
    label: "Servicio",
    placeholder: "Selecciona una opción",
    options,
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithHelper: Story = {
  args: {
    helperText:
      "Puedes actualizar el servicio después de la inspección inicial.",
  },
};

export const ErrorState: Story = {
  args: {
    error: "Selecciona al menos un servicio para continuar.",
    value: "",
  },
};

export const LargeSelect: Story = {
  args: {
    selectSize: "lg",
    defaultValue: "turnover",
  },
};
