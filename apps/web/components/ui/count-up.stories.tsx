import type { Meta, StoryObj } from "@storybook/react";
import { TrendingUp } from "lucide-react";
import { CountUp, KPICountUp } from "./count-up";

const meta = {
  title: "UI/CountUp",
  component: CountUp,
  parameters: {
    layout: "centered",
  },
  args: {
    end: 12800,
    suffix: "+",
    duration: 2.5,
    className: "text-4xl font-semibold text-brisa-50",
  },
} satisfies Meta<typeof CountUp>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const PrefixAndSuffix: Story = {
  args: {
    prefix: "≈",
    suffix: "%",
    end: 81,
    duration: 2,
  },
};

export const WithDecimals: Story = {
  args: {
    end: 4.5,
    decimals: 1,
    suffix: "★",
    duration: 1.8,
  },
};

export const KPIShowcase: Story = {
  render: () => (
    <div className="w-full max-w-sm">
      <KPICountUp
        label="Tasa de respuesta"
        value={87}
        suffix="%"
        trend="up"
        trendLabel="vs. semana anterior"
        icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
      />
    </div>
  ),
};
