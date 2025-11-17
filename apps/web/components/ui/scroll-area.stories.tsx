import type { Meta, StoryObj } from "@storybook/react";
import { ScrollArea } from "./scroll-area";

const paragraphs = Array.from({ length: 12 }).map((_, index) => (
  <p key={index} className="text-sm text-brisa-200">
    <strong>Checklist #{index + 1}:</strong> Sanitiza superficies, captura
    evidencia y registra el turno en menos de 4 horas.
  </p>
));

const meta = {
  title: "UI/ScrollArea",
  component: ScrollArea,
  args: {
    maxHeight: 240,
  },
} satisfies Meta<typeof ScrollArea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
  render: (args) => (
    <ScrollArea
      {...args}
      className="w-full max-w-md space-y-3 rounded-2xl border border-brisa-800/50 bg-brisa-950 p-4"
    >
      {paragraphs}
    </ScrollArea>
  ),
};

export const Horizontal: Story = {
  args: {
    orientation: "horizontal",
    maxHeight: undefined,
  },
  render: (args) => (
    <ScrollArea
      {...args}
      className="w-full rounded-2xl border border-brisa-800/50 bg-brisa-950 p-4"
    >
      <div className="flex min-w-[600px] gap-4">
        {paragraphs.slice(0, 4).map((para, index) => (
          <div
            key={index}
            className="min-w-[220px] space-y-2 rounded-xl border border-brisa-800/60 p-3"
          >
            {para}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};
