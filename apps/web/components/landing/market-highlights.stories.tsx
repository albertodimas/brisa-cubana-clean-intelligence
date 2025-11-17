import type { Meta, StoryObj } from "@storybook/react";
import { MarketHighlightsGrid } from "./market-highlights";

const meta = {
  title: "Landing/Market Highlights Grid",
  component: MarketHighlightsGrid,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof MarketHighlightsGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
