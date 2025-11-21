import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Radio, RadioGroup } from "./radio";

type Option = {
  value: string;
  label: string;
  description?: string;
};

type RadioPreviewProps = {
  label?: string;
  description?: string;
  orientation?: "vertical" | "horizontal";
  options?: Option[];
  defaultValue?: string;
};

const defaultOptions: Option[] = [
  { value: "weekly", label: "Semanal", description: "Hasta 10 turnos" },
  {
    value: "biweekly",
    label: "Quincenal",
    description: "Ideal para deep cleaning",
  },
  {
    value: "monthly",
    label: "Mensual",
    description: "Mantenimiento preventivo",
  },
];

function RadioPreview({
  options = defaultOptions,
  defaultValue = options[0]?.value ?? "",
  ...props
}: RadioPreviewProps) {
  const [value, setValue] = useState(defaultValue);
  return (
    <RadioGroup
      {...props}
      name="radio-preview"
      value={value}
      onChange={setValue}
    >
      {options.map((option) => (
        <Radio
          key={option.value}
          value={option.value}
          label={option.label}
          description={option.description}
        />
      ))}
    </RadioGroup>
  );
}

const meta = {
  title: "UI/Radio",
  component: RadioPreview,
  args: {
    label: "Frecuencia de servicio",
    description: "Selecciona el plan que mejor se adapte a tu inventario",
  },
} satisfies Meta<typeof RadioPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Vertical: Story = {};

export const Horizontal: Story = {
  args: {
    orientation: "horizontal",
  },
};
