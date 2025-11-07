import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StaffWorkloadChart } from "./staff-workload-chart";

// Mock recharts - it has complex client-side dependencies
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="chart-container">{children}</div>
  ),
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

describe("StaffWorkloadChart", () => {
  it("renders chart title", () => {
    const data = [
      {
        staffId: "staff-1",
        staffName: "Juan Pérez",
        bookingsCount: 10,
      },
      {
        staffId: "staff-2",
        staffName: "María García",
        bookingsCount: 8,
      },
    ];

    render(<StaffWorkloadChart data={data} />);

    expect(screen.getByText("Carga de Trabajo por Staff")).toBeInTheDocument();
  });

  it("renders empty state when no data", () => {
    render(<StaffWorkloadChart data={[]} />);

    expect(screen.getByText("Carga de Trabajo por Staff")).toBeInTheDocument();
    expect(
      screen.getByText("No hay staff asignado a reservas"),
    ).toBeInTheDocument();
  });

  it("does not render chart when empty", () => {
    render(<StaffWorkloadChart data={[]} />);

    expect(screen.queryByTestId("chart-container")).not.toBeInTheDocument();
  });
});
