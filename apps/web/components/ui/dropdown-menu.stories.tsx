import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuShortcut,
} from "./dropdown-menu";
import { Button } from "./button";

type DropdownMenuPreviewProps = {
  showSubmenu?: boolean;
};

function DropdownMenuPreview({ showSubmenu = true }: DropdownMenuPreviewProps) {
  const [shortcuts, setShortcuts] = useState({
    concierge: true,
    conciergeReports: false,
    notifySlack: true,
  });
  const [viewMode, setViewMode] = useState("kanban");

  const handleCheckedChange =
    (key: keyof typeof shortcuts) => (value: boolean | "indeterminate") => {
      setShortcuts((prev) => ({
        ...prev,
        [key]: value === true,
      }));
    };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary">Acciones del turno</Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel>Checklist operativo</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={shortcuts.concierge}
          onCheckedChange={handleCheckedChange("concierge")}
        >
          Concierge asignada
          <DropdownMenuShortcut>⌘+1</DropdownMenuShortcut>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={shortcuts.conciergeReports}
          onCheckedChange={handleCheckedChange("conciergeReports")}
        >
          Reportes con evidencia
          <DropdownMenuShortcut>⌘+2</DropdownMenuShortcut>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={shortcuts.notifySlack}
          onCheckedChange={handleCheckedChange("notifySlack")}
        >
          Notificar en Slack
          <DropdownMenuShortcut>⌘+3</DropdownMenuShortcut>
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Vista del panel</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={viewMode} onValueChange={setViewMode}>
          <DropdownMenuRadioItem value="kanban">
            Kanban de cuadrillas
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="timeline">
            Timeline con SLA
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="calendar">
            Calendario semanal
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        {showSubmenu ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                Exportar evidencia
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-56">
                <DropdownMenuItem>Resumen PDF</DropdownMenuItem>
                <DropdownMenuItem>Carpeta Drive</DropdownMenuItem>
                <DropdownMenuItem>Enviar a propietario</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        ) : null}

        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-400">
          Cancelar turno
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const meta = {
  title: "UI/Dropdown Menu",
  component: DropdownMenuPreview,
  argTypes: {
    showSubmenu: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof DropdownMenuPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SinSubmenu: Story = {
  args: {
    showSubmenu: false,
  },
};
