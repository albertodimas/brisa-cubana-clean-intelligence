import type { Meta, StoryObj } from "@storybook/react";
import { NightShiftMedia } from "./night-shift-media";

const meta = {
  title: "Landing/Night Shift Media",
  component: NightShiftMedia,
} satisfies Meta<typeof NightShiftMedia>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
