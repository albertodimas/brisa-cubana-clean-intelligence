import type { Meta, StoryObj } from "@storybook/react";
import { Info } from "lucide-react";
import { Tooltip } from "./tooltip";
import { Button } from "./button";

const meta = {
  title: "UI/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
  },
  args: {
    content: "Supervisa cada turnover con evidencia y SLA en vivo.",
  },
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

const defaultTrigger = (
  <Button variant="secondary" icon={<Info className="h-4 w-4" />}>
    Hover o focus
  </Button>
);

export const Default: Story = {
  args: {
    children: defaultTrigger,
  },
};

export const Posiciones: Story = {
  args: {
    children: defaultTrigger,
  },
  render: () => (
    <div className="grid gap-8 grid-cols-2 max-w-lg">
      {(["top", "right", "bottom", "left"] as const).map((position) => (
        <Tooltip
          key={position}
          position={position}
          content={`Tooltip ${position}`}
        >
          <Button variant="ghost" className="w-full">
            {position.toUpperCase()}
          </Button>
        </Tooltip>
      ))}
    </div>
  ),
};

export const SinDelay: Story = {
  args: {
    children: <Button>Tooltip inmediato</Button>,
    content: "Sin retraso; ideal para atajos de teclado.",
    delay: 0,
    position: "bottom",
  },
  render: (args) => <Tooltip {...args} />,
};
