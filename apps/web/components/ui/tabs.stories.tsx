import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  AnimatedTabsList,
} from "./tabs";

const sections = [
  {
    value: "overview",
    label: "Resumen",
    content: "KPIs en vivo, ocupación y alertas operativas de las últimas 24h.",
  },
  {
    value: "bookings",
    label: "Reservas",
    content:
      "Pipeline por estado, SLA y asignaciones pendientes por cuadrilla.",
  },
  {
    value: "staff",
    label: "Staff",
    content: "Disponibilidad, horas asignadas y backlog de capacitación.",
  },
];

function TabsPreview({ animated = false }: { animated?: boolean }) {
  const [value, setValue] = useState(sections[0].value);
  const ListComponent = animated ? AnimatedTabsList : TabsList;

  return (
    <Tabs value={value} onValueChange={setValue}>
      <ListComponent className="mb-4">
        {sections.map((section) => (
          <TabsTrigger key={section.value} value={section.value}>
            {section.label}
          </TabsTrigger>
        ))}
      </ListComponent>
      {sections.map((section) => (
        <TabsContent key={section.value} value={section.value}>
          <div className="rounded-2xl border border-brisa-700/30 bg-brisa-900/60 p-4 text-sm text-brisa-200">
            {section.content}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

const meta = {
  title: "UI/Tabs",
  component: TabsPreview,
} satisfies Meta<typeof TabsPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Standard: Story = {};

export const AnimatedIndicator: Story = {
  args: {
    animated: true,
  },
};
