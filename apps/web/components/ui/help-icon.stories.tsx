import type { Meta, StoryObj } from "@storybook/react";
import { HelpIcon, HelpText, InfoBanner } from "./help-icon";

const meta = {
  title: "UI/Help Icon",
  component: HelpIcon,
} satisfies Meta<typeof HelpIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Iconos: Story = {
  args: {
    content: "Icono de ayuda",
  },
  render: () => (
    <div className="flex flex-wrap items-center gap-4 text-sm text-brisa-200">
      <span className="flex items-center gap-2">
        SLA:
        <HelpIcon
          content="Tiempo límite comprometido con el propietario."
          position="bottom"
        />
      </span>
      <span className="flex items-center gap-2">
        Concierge asignado:
        <HelpIcon content="Persona que coordina accesos y llaves." size="md" />
      </span>
      <span className="flex items-center gap-2">
        Checklist nocturno:
        <HelpIcon
          content="Incluye 25 fotos HDR y reporte en vivo."
          size="lg"
          position="right"
        />
      </span>
    </div>
  ),
};

export const TextoYAvisos: Story = {
  args: {
    content: "Icono de ayuda",
  },
  render: () => (
    <div className="space-y-4">
      <HelpText>
        Este reporte solo es visible para operaciones. Compartiremos un enlace
        resumido con el cliente.
      </HelpText>
      <InfoBanner variant="tip">
        Los turnos nocturnos incluyen documentación audiovisual adicional. Sube
        los archivos antes de cerrar el día.
      </InfoBanner>
      <InfoBanner variant="warning">
        Detectamos 2 incidencias abiertas en la última semana. Confirma el
        seguimiento antes de exportar datos.
      </InfoBanner>
    </div>
  ),
};
