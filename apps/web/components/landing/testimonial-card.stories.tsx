import type { Meta, StoryObj } from "@storybook/react";
import { TestimonialCard, TestimonialGrid } from "./testimonial-card";

const baseTestimonial = {
  quote:
    "Brisa documenta cada turno como si fuese el primero. Los propietarios reciben reportes con 40+ fotos y nunca tuvimos otro reclamo por limpieza.",
  author: "Isabela Romero",
  role: "Head of Operations",
  company: "Luxe Rentals Miami",
  rating: 5,
  avatar: "/branding/client-tablet-workspace.webp",
};

const meta = {
  title: "Landing/Testimonial Card",
  component: TestimonialCard,
  args: baseTestimonial,
} satisfies Meta<typeof TestimonialCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Individual: Story = {};

export const Grid: Story = {
  render: () => (
    <TestimonialGrid
      columns={2}
      testimonials={[
        baseTestimonial,
        {
          quote:
            "El night shift media nos permite mostrar transparencia total a los inversores sin estar en el sitio.",
          author: "Héctor Valdés",
          role: "Asset Manager",
          company: "Brickell Capital",
          rating: 5,
        },
        {
          quote:
            "Integraron Slack y en cada turno recibo el checklist firmado. Simplificó nuestro NPS.",
          author: "Carolyn Ortega",
          role: "Broker",
          rating: 4,
        },
      ]}
    />
  ),
};
