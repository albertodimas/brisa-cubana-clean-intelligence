import type { Meta, StoryObj } from "@storybook/react";
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from "./table";

const sampleRows = [
  {
    property: "Brickell Collection 502",
    supervisor: "Carla",
    crew: "Cuadrilla Norte",
    sla: "3h 45m",
    status: "En progreso",
  },
  {
    property: "Wynwood Lofts 3B",
    supervisor: "Luis",
    crew: "Express",
    sla: "2h 10m",
    status: "Completado",
  },
  {
    property: "Coconut Grove House",
    supervisor: "Andrea",
    crew: "Premium",
    sla: "4h 05m",
    status: "Asignado",
  },
];

type TablePreviewProps = {
  emphasizeStatus?: boolean;
};

function TablePreview({ emphasizeStatus = true }: TablePreviewProps) {
  return (
    <div className="max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <Table className="text-white">
        <TableHead>
          <TableRow>
            <TableHeader>Propiedad</TableHeader>
            <TableHeader>Supervisor</TableHeader>
            <TableHeader>Cuadrilla</TableHeader>
            <TableHeader align="right">SLA restante</TableHeader>
            <TableHeader align="right">Estado</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {sampleRows.map((row) => (
            <TableRow key={row.property}>
              <TableCell>{row.property}</TableCell>
              <TableCell>{row.supervisor}</TableCell>
              <TableCell>{row.crew}</TableCell>
              <TableCell align="right">{row.sla}</TableCell>
              <TableCell align="right">
                {emphasizeStatus ? (
                  <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                    {row.status}
                  </span>
                ) : (
                  row.status
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const meta = {
  title: "UI/Table",
  component: TablePreview,
  argTypes: {
    emphasizeStatus: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof TablePreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TextoPlano: Story = {
  args: {
    emphasizeStatus: false,
  },
};
