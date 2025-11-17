import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Alert, AlertTitle, AlertDescription } from "./alert";
import { Button } from "./button";

const meta = {
  title: "UI/Alert",
  component: Alert,
} satisfies Meta<typeof Alert>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Variantes: Story = {
  render: () => (
    <div className="space-y-4 max-w-2xl">
      <Alert variant="default">
        <AlertTitle>Actualización del portal</AlertTitle>
        <AlertDescription>
          Estamos desplegando la vista nueva de reservas. Podrías notar recargas
          automáticas durante los próximos 3 minutos.
        </AlertDescription>
      </Alert>

      <Alert variant="success">
        <AlertTitle>Turno completado</AlertTitle>
        <AlertDescription>
          Brickell Collection 502 quedó listo en 3h 41m. Ya enviamos el reporte
          con 28 fotos y checklist firmado al propietario.
        </AlertDescription>
      </Alert>

      <Alert variant="warning">
        <AlertTitle>Inventario en riesgo</AlertTitle>
        <AlertDescription>
          El kit de amenities para Wynwood Lofts se agotará hoy. Agenda
          reposición antes de las 18:00 para evitar retrasos.
        </AlertDescription>
      </Alert>

      <Alert variant="error">
        <AlertTitle>Error al sincronizar con Notion</AlertTitle>
        <AlertDescription>
          No pudimos actualizar la bitácora del turno nocturno. Revisa tus
          credenciales o intenta nuevamente en unos minutos.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

function DismissibleAlertDemo() {
  const [resetCount, setResetCount] = useState(0);
  const [dismissed, setDismissed] = useState(0);

  return (
    <div className="space-y-4 max-w-xl">
      <Alert
        key={resetCount}
        variant="info"
        dismissible
        onDismiss={() => setDismissed((prev) => prev + 1)}
      >
        <AlertTitle>Seguimiento pausado</AlertTitle>
        <AlertDescription>
          Detuvimos las notificaciones push para este dispositivo. Actívalas de
          nuevo cuando quieras monitorear a tu equipo.
        </AlertDescription>
      </Alert>
      <div className="flex items-center gap-3 text-sm text-brisa-300">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setResetCount((prev) => prev + 1)}
        >
          Mostrar alerta otra vez
        </Button>
        <span>
          Se cerró {dismissed} vez{dismissed === 1 ? "" : "es"}.
        </span>
      </div>
    </div>
  );
}

export const Descartable: Story = {
  render: () => <DismissibleAlertDemo />,
};
