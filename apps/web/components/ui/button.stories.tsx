import type { Meta, StoryObj } from "@storybook/react";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "./button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  args: {
    children: "Acción principal",
  },
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: {
    variant: "secondary",
  },
};

export const WithIcon: Story = {
  args: {
    children: "Contactar",
    icon: <Mail className="h-4 w-4" />,
  },
};

export const Loading: Story = {
  args: {
    children: "Guardando…",
    isLoading: true,
    icon: <Loader2 className="h-4 w-4" />,
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Button {...args} size="xs">
        XS
      </Button>
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
      <Button {...args} size="xl">
        XL
      </Button>
    </div>
  ),
};
