import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BookingsByStatusChart } from "./bookings-by-status-chart";

// Mock recharts - it has complex client-side dependencies
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="chart-container">{children}</div>
  ),
  PieChart: () => <div data-testid="pie-chart" />,
  Pie: () => null,
  Cell: () => null,
  Legend: () => null,
  Tooltip: () => null,
}));

describe("BookingsByStatusChart", () => {
  it("renders chart title", () => {
    const data = [
      { status: "CONFIRMED", count: 10, percentage: 50 },
      { status: "PENDING", count: 5, percentage: 25 },
      { status: "COMPLETED", count: 5, percentage: 25 },
    ];

    render(<BookingsByStatusChart data={data} />);

    expect(screen.getByText("Reservas por Estado")).toBeInTheDocument();
  });

  it("renders empty state when no data", () => {
    render(<BookingsByStatusChart data={[]} />);

    expect(screen.getByText("Reservas por Estado")).toBeInTheDocument();
    expect(screen.getByText("No hay datos disponibles")).toBeInTheDocument();
  });

  it("does not render chart when empty", () => {
    render(<BookingsByStatusChart data={[]} />);

    expect(screen.queryByTestId("chart-container")).not.toBeInTheDocument();
  });
});
