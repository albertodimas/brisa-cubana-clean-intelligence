import type { Meta, StoryObj } from "@storybook/react";
import { TrendingUp, DollarSign, Clock, ShieldCheck } from "lucide-react";
import { KPICard } from "./kpi-card";

const meta = {
  title: "Landing/KPI Card",
  component: KPICard,
  args: {
    label: "SLA cumplido",
    value: 97,
    suffix: "%",
    description: "Promedio últimos 90 días",
    icon: ShieldCheck,
    trend: "up",
    trendValue: "+4 pts",
  },
} satisfies Meta<typeof KPICard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Individual: Story = {};

export const Grid: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <KPICard
        label="Turnos mensuales"
        value={320}
        suffix="+"
        description="Distribuidos en Miami & Brickell"
        icon={TrendingUp}
        trend="up"
        trendValue="+18%"
      />
      <KPICard
        label="Upsells documentados"
        value="USD 12.4K"
        description="Night shift media y concierge"
        icon={DollarSign}
        animateNumber={false}
      />
      <KPICard
        label="Tiempo promedio onsite"
        value={4}
        suffix="h"
        description="Incluye staging y reposición"
        icon={Clock}
        trend="neutral"
        trendValue="SLA 4h"
      />
      <KPICard
        label="Tickets resueltos"
        value={143}
        description="Portal + Slack"
        icon={ShieldCheck}
        trend="down"
        trendValue="-32%"
      />
    </div>
  ),
};
