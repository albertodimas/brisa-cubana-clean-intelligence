import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ExportButton } from "./export-button";

type BookingRow = {
  property: string;
  supervisor: string;
  slaMinutes: number;
  incidents: number;
};

const baseData: BookingRow[] = [
  {
    property: "Brickell Collection 502",
    supervisor: "Carla",
    slaMinutes: 235,
    incidents: 0,
  },
  {
    property: "Wynwood Lofts 3B",
    supervisor: "Luis",
    slaMinutes: 132,
    incidents: 2,
  },
  {
    property: "Coconut Grove House",
    supervisor: "Andrea",
    slaMinutes: 248,
    incidents: 1,
  },
];

const columns = [
  { key: "property", label: "Propiedad" },
  { key: "supervisor", label: "Supervisor" },
  {
    key: "slaMinutes",
    label: "SLA (min)",
    transform: (row: BookingRow) => `${row.slaMinutes} min`,
  },
  {
    key: "incidents",
    label: "Incidencias",
    transform: (row: BookingRow) =>
      row.incidents === 0 ? "Sin incidencias" : `${row.incidents} alertas`,
  },
];

function ExportButtonPlayground() {
  const [dataset, setDataset] = useState<"short" | "long">("short");

  const data = useMemo(() => {
    if (dataset === "short") {
      return baseData;
    }

    return Array.from({ length: 6000 }).map((_, index) => ({
      property: `Propiedad #${index + 1}`,
      supervisor: index % 2 === 0 ? "Carla" : "Luis",
      slaMinutes: 180 + (index % 45),
      incidents: index % 9 === 0 ? 1 : 0,
    }));
  }, [dataset]);

  return (
    <div className="space-y-4 max-w-lg">
      <div className="flex items-center gap-3 text-sm text-brisa-300">
        <span>Dataset:</span>
        <button
          type="button"
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            dataset === "short"
              ? "bg-brisa-500 text-white"
              : "bg-white/10 text-brisa-100"
          }`}
          onClick={() => setDataset("short")}
        >
          3 registros
        </button>
        <button
          type="button"
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            dataset === "long"
              ? "bg-brisa-500 text-white"
              : "bg-white/10 text-brisa-100"
          }`}
          onClick={() => setDataset("long")}
        >
          6000 registros
        </button>
        <span className="ml-auto text-xs text-brisa-400">
          {dataset === "long"
            ? "Muestra aviso de exportación grande"
            : "Descarga directa"}
        </span>
      </div>

      <ExportButton
        data={data}
        columns={columns}
        filename={`turnos-${dataset}`}
        resourceType="bookings"
        maxRows={500}
      />
    </div>
  );
}

const meta = {
  title: "UI/Export Button",
  component: ExportButton,
} satisfies Meta<typeof ExportButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    data: [],
    filename: "preview",
    columns: [],
  },
  render: () => <ExportButtonPlayground />,
};

export const Disabled: Story = {
  args: {
    data: [],
    filename: "turnos-vacios",
    columns: [],
  },
  render: () => (
    <ExportButton
      data={[]}
      columns={columns}
      filename="turnos-vacios"
      resourceType="bookings"
      disabled
    />
  ),
};
