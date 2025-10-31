import type { Meta, StoryObj } from "@storybook/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";
import { Button } from "./button";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  args: {
    variant: "default",
    padding: "md",
  },
  parameters: {
    layout: "centered",
    backgrounds: { default: "dark" },
  },
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Playground: Story = {
  render: (args) => (
    <Card {...args} className="w-96">
      <CardHeader>
        <CardTitle>Turnover premium</CardTitle>
        <CardDescription>
          Checklist de 100 puntos, reposición de inventario y reporte con fotos
          en menos de 4 h.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-brisa-100/80">
          <li>• Equipo asignado y seguimiento en tiempo real</li>
          <li>• QA con firma digital y evidencias before/after</li>
          <li>• Integración con portal cliente y notificaciones</li>
        </ul>
      </CardContent>
      <CardFooter className="justify-end gap-2 border-none pt-0">
        <Button variant="ghost" size="sm">
          Detalles
        </Button>
        <Button size="sm">Solicitar</Button>
      </CardFooter>
    </Card>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      {(["default", "elevated", "glass", "outline"] as const).map((variant) => (
        <Card key={variant} variant={variant} className="w-80">
          <CardHeader>
            <CardTitle className="capitalize">{variant}</CardTitle>
            <CardDescription>
              Demostración de estilo para la tarjeta {variant}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-brisa-100/80">
              Ajusta el padding y el estado hover con las props provistas.
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
};
