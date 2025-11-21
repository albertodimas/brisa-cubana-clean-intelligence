import type { Meta, StoryObj } from "@storybook/react";
import { BeforeAfterGallery } from "./before-after-gallery";

const sampleScenarios = [
  {
    id: "cocina",
    label: "Cocina",
    title: "Deep clean + staging",
    description:
      "Checklist completo con sanitización de superficies, reposición de amenities y staging listo para fotografía profesional.",
    highlights: [
      "Pulido de encimeras y grifería",
      "Reposición de textiles y vajilla",
      "QA con checklist digital",
      "Galería before/after en el portal",
    ],
    before: {
      src: "/branding/kitchen-before.webp",
      alt: "Cocina antes del servicio",
    },
    after: {
      src: "/branding/kitchen-after.webp",
      alt: "Cocina después del servicio",
    },
  },
  {
    id: "dormitorio",
    label: "Dormitorio",
    title: "Turnover premium",
    description:
      "Incluye lavandería in-house, aromatización y staging con textiles adicionales para mejorar el ADR.",
    highlights: [
      "Inventario trazable",
      "Reposición de amenities",
      "Staging fotográfico",
      "Reporte QA en menos de 4h",
    ],
    before: {
      src: "/branding/bedroom-before.webp",
      alt: "Dormitorio antes",
    },
    after: {
      src: "/branding/bedroom-after.webp",
      alt: "Dormitorio después",
    },
  },
];

const meta = {
  title: "Landing/Before After Gallery",
  component: BeforeAfterGallery,
  args: {
    scenarios: sampleScenarios,
  },
} satisfies Meta<typeof BeforeAfterGallery>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleScenario: Story = {
  args: {
    scenarios: [sampleScenarios[0]],
  },
};
