import type { Meta, StoryObj } from "@storybook/react";
import { TiltCard, HoverLiftCard, MagneticCard } from "./tilt-card";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";
import { Button } from "./button";

const meta = {
  title: "UI/Tilt Card",
  component: TiltCard,
} satisfies Meta<typeof TiltCard>;

export default meta;

type Story = StoryObj<typeof meta>;

const SampleCard = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <Card className="max-w-xs">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between text-sm text-brisa-200">
        <span>Último turno</span>
        <strong>3h 42m</strong>
      </div>
    </CardContent>
    <CardFooter className="justify-between border-t border-brisa-700/20 pt-4 mt-6">
      <Button size="sm" variant="ghost">
        Detalles
      </Button>
      <Button size="sm">Ver reportes</Button>
    </CardFooter>
  </Card>
);

export const Interactivo: Story = {
  args: {
    children: (
      <SampleCard
        title="Brickell Collection"
        description="12 unidades · Concierge onsite"
      />
    ),
    maxTilt: 12,
    scale: 1.04,
    glowEffect: true,
  },
  render: (args) => <TiltCard {...args} />,
};

export const HoverLift: Story = {
  args: {
    children: (
      <SampleCard
        title="Night Shift Media"
        description="Cobertura nocturna y entrega en 2h"
      />
    ),
  },
  render: () => (
    <div className="flex flex-wrap gap-6">
      <HoverLiftCard>
        <SampleCard
          title="Night Shift Media"
          description="Cobertura nocturna y entrega en 2h"
        />
      </HoverLiftCard>
      <HoverLiftCard glowColor="rgba(255,255,255,0.15)">
        <SampleCard
          title="Turnos Express"
          description="SLA 2h · Prioridad Miami Beach"
        />
      </HoverLiftCard>
    </div>
  ),
};

export const Magnetic: Story = {
  args: {
    children: (
      <SampleCard
        title="Operación Premium"
        description="Checklist avanzado con auditoría fotográfica."
      />
    ),
  },
  render: () => (
    <MagneticCard strength={15}>
      <SampleCard
        title="Operación Premium"
        description="Checklist avanzado con auditoría fotográfica."
      />
    </MagneticCard>
  ),
};
