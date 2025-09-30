import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../button";

const meta: Meta<typeof Button> = {
  title: "Design System/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Botón base del sistema de diseño Brisa Cubana.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: "Agendar servicio",
    intent: "primary",
  },
};

export const Secondary: Story = {
  args: {
    children: "Ver más",
    intent: "secondary",
  },
};

export const Ghost: Story = {
  args: {
    children: "Acción secundaria",
    intent: "ghost",
  },
};
