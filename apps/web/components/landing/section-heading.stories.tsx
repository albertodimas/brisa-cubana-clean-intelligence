import type { Meta, StoryObj } from "@storybook/react";
import { SectionHeading } from "./section-heading";

const meta = {
  title: "Landing/Section Heading",
  component: SectionHeading,
  args: {
    eyebrow: "Servicios premium",
    title: "Coordinamos la operación end-to-end",
    description:
      "Desde inventario digital hasta QA fotográfico y portal de clientes con tu marca.",
  },
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof SectionHeading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Centered: Story = {
  args: {
    align: "center",
  },
};

export const WithoutAnimation: Story = {
  args: {
    animated: false,
  },
};
