import type { Meta, StoryObj } from "@storybook/react";
import { ThemeProvider, useTheme } from "../theme-provider";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./button";

function ThemeTogglePreview() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-4 items-start">
      <ThemeToggle />
      <div className="text-sm text-brisa-300">
        Tema seleccionado: <strong className="text-brisa-50">{theme}</strong>{" "}
        (resuelto: {resolvedTheme})
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => setTheme("light")}>
          Modo claro
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setTheme("dark")}>
          Modo oscuro
        </Button>
        <Button variant="outline" size="sm" onClick={() => setTheme("system")}>
          Seguir sistema
        </Button>
      </div>
    </div>
  );
}

const meta = {
  title: "UI/Theme Toggle",
  component: ThemeTogglePreview,
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof ThemeTogglePreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
