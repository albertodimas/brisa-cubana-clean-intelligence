import type { Meta, StoryObj } from "@storybook/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";

const sampleItems = [
  {
    title: "Reforzamos cada turno",
    content:
      "Checklists digitales, evidencia fotográfica y firmas dobles se entregan en menos de 4 horas para cada propiedad.",
  },
  {
    title: "Integraciones PMS",
    content:
      "Sincronizamos Guesty, Hostaway y ResNexus para disparar alertas operativas y mantener la agenda al día.",
  },
  {
    title: "Escalamiento 24/7",
    content:
      "Operaciones y NOC monitorean WhatsApp Business, Slack y PostHog para reaccionar en menos de 15 minutos.",
  },
];

type AccordionStoryProps = React.ComponentProps<typeof Accordion> & {
  items?: typeof sampleItems;
};

function AccordionPreview({
  items = sampleItems,
  ...props
}: AccordionStoryProps) {
  return (
    <div className="max-w-2xl">
      <Accordion {...props}>
        {items.map((item, index) => (
          <AccordionItem value={`item-${index + 1}`} key={item.title}>
            <AccordionTrigger>{item.title}</AccordionTrigger>
            <AccordionContent>{item.content}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

const meta = {
  title: "UI/Accordion",
  component: AccordionPreview,
  args: {
    type: "single",
    collapsible: true,
    defaultValue: "item-1",
  },
} satisfies Meta<typeof AccordionPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Single: Story = {
  args: {},
};

export const Multiple: Story = {
  args: {
    type: "multiple",
    defaultValue: ["item-1", "item-2"],
  },
};
