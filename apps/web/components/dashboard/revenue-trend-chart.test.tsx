import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RevenueTrendChart } from "./revenue-trend-chart";

// Mock recharts - it has complex client-side dependencies
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="chart-container">{children}</div>
  ),
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

describe("RevenueTrendChart", () => {
  it("renders chart title", () => {
    const data = [
      { date: "2025-11-01", amount: 100 },
      { date: "2025-11-02", amount: 200 },
      { date: "2025-11-03", amount: 150 },
    ];

    render(<RevenueTrendChart data={data} />);

    expect(
      screen.getByText("Tendencia de Ingresos (Últimos 30 días)"),
    ).toBeInTheDocument();
  });

  it("renders empty state when no data", () => {
    render(<RevenueTrendChart data={[]} />);

    expect(
      screen.getByText("Tendencia de Ingresos (Últimos 30 días)"),
    ).toBeInTheDocument();
    expect(screen.getByText("No hay datos disponibles")).toBeInTheDocument();
  });

  it("does not render chart when empty", () => {
    render(<RevenueTrendChart data={[]} />);

    expect(screen.queryByTestId("chart-container")).not.toBeInTheDocument();
  });
});
