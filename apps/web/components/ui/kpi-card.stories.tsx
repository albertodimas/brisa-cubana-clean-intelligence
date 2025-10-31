import type { Meta, StoryObj } from "@storybook/react";
import { CalendarClock, LucideWallet, Users } from "lucide-react";
import { KPICard } from "./kpi-card";

const meta = {
  title: "UI/KPICard",
  component: KPICard,
  parameters: {
    layout: "centered",
  },
  args: {
    title: "Total reservas",
    value: 1280,
    description: "Últimos 30 días",
    trendPercentage: "+12.4%",
    trend: "up",
    icon: <CalendarClock className="h-5 w-5" />,
    cardVariant: "elevated",
    hoverable: true,
  },
} satisfies Meta<typeof KPICard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Compact: Story = {
  args: {
    title: "Ingresos",
    value: "$82,450",
    description: "Mes en curso",
    trend: "neutral",
    trendPercentage: "≈0.2%",
    size: "sm",
    icon: <LucideWallet className="h-5 w-5" />,
  },
};

export const NegativeTrend: Story = {
  args: {
    title: "Cancelaciones",
    value: 42,
    description: "Últimos 7 días",
    trend: "down",
    trendPercentage: "-5.1%",
    size: "lg",
    cardVariant: "glass",
    icon: <Users className="h-5 w-5" />,
  },
};
