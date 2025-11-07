import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopPropertiesChart } from "./top-properties-chart";

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

describe("TopPropertiesChart", () => {
  it("renders chart title", () => {
    const data = [
      {
        propertyId: "prop-1",
        propertyLabel: "Casa Vedado",
        bookingsCount: 25,
      },
      {
        propertyId: "prop-2",
        propertyLabel: "Apartamento Miramar",
        bookingsCount: 20,
      },
    ];

    render(<TopPropertiesChart data={data} />);

    expect(
      screen.getByText("Top 5 Propiedades Más Solicitadas"),
    ).toBeInTheDocument();
  });

  it("renders empty state when no data", () => {
    render(<TopPropertiesChart data={[]} />);

    expect(
      screen.getByText("Top 5 Propiedades Más Solicitadas"),
    ).toBeInTheDocument();
    expect(screen.getByText("No hay datos disponibles")).toBeInTheDocument();
  });

  it("does not render chart when empty", () => {
    render(<TopPropertiesChart data={[]} />);

    expect(screen.queryByTestId("chart-container")).not.toBeInTheDocument();
  });
});
