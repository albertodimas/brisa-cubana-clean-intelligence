import type { Meta, StoryObj } from "@storybook/react";
import { MarketStatsSnapshot } from "./market-stats-snapshot";

const meta = {
  title: "Landing/Market Stats Snapshot",
  component: MarketStatsSnapshot,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof MarketStatsSnapshot>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
