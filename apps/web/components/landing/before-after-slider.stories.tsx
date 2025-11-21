import type { Meta, StoryObj } from "@storybook/react";
import { BeforeAfterSlider } from "./before-after-slider";

const meta = {
  title: "Landing/Before After Slider",
  component: BeforeAfterSlider,
  args: {
    beforeImage: "/branding/bedroom-before.webp",
    afterImage: "/branding/bedroom-after.webp",
    beforeAlt: "Habitación antes de la limpieza",
    afterAlt: "Habitación después de la limpieza",
    initialPosition: 55,
  },
} satisfies Meta<typeof BeforeAfterSlider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    beforeLabel: "Antes de Brisa",
    afterLabel: "Después de Brisa",
    aspectRatio: "16/9",
  },
};

export const SquareShowcase: Story = {
  args: {
    aspectRatio: "1/1",
    initialPosition: 40,
    beforeLabel: "Check-out",
    afterLabel: "Listo para check-in",
  },
};
