import type { Meta, StoryObj } from "@storybook/react";
import { MarketStatsSnapshot } from "./market-stats";

const meta: Meta<typeof MarketStatsSnapshot> = {
  title: "Landing/Market Stats Snapshot",
  component: MarketStatsSnapshot,
  parameters: {
    layout: "centered",
    backgrounds: { default: "light" },
  },
};

export default meta;

type Story = StoryObj<typeof MarketStatsSnapshot>;

export const Default: Story = {};
