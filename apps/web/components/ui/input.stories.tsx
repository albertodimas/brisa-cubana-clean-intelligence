import type { Meta, StoryObj } from "@storybook/react";
import { Eye, Mail } from "lucide-react";
import { Input } from "./input";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  args: {
    label: "Email corporativo",
    placeholder: "nombre@empresa.com",
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithHelper: Story = {
  args: {
    helperText: "Usaremos este correo para reportes y notificaciones.",
  },
};

export const WithIcons: Story = {
  args: {
    prefixIcon: <Mail className="h-4 w-4" aria-hidden />,
    suffixIcon: <Eye className="h-4 w-4" aria-hidden />,
  },
};

export const ErrorState: Story = {
  args: {
    error: "Correo inválido. Asegúrate de usar tu dominio corporativo.",
    defaultValue: "incompleto@",
  },
};

export const LargeInput: Story = {
  args: {
    inputSize: "lg",
    helperText: "Ideal para títulos o campos largos.",
  },
};
