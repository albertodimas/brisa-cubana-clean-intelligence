import type { Meta, StoryObj } from "@storybook/react";
import { FAQSection } from "./faq-section";

const sampleFaq = [
  {
    question: "¿Cuánto tarda un turnover completo?",
    answer:
      "Depende del tamaño y requerimientos, pero nuestro SLA estándar es de 4 horas incluyendo limpieza, staging, inventario y evidencia fotográfica.",
  },
  {
    question: "¿Pueden trabajar con mis propios proveedores?",
    answer:
      "Sí. Coordinamos con tus proveedores de lavandería, mantenimiento y concierge. Solo necesitamos los contactos y horarios con 24h de anticipación.",
  },
  {
    question: "¿Cómo entregan los reportes?",
    answer:
      "Cada turno genera un informe en el portal con fotos, videos y checklist firmado. También podemos notificar por Slack, email o SMS si necesitas alertas inmediatas.",
  },
];

const meta = {
  title: "Landing/FAQ Section",
  component: FAQSection,
  args: {
    items: sampleFaq,
  },
  parameters: {
    backgrounds: {
      default: "light",
    },
  },
} satisfies Meta<typeof FAQSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ConTituloPersonalizado: Story = {
  args: {
    title: "Operación y soporte",
    subtitle: "Resolvemos dudas frecuentes antes del onboarding.",
  },
};
