import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatsCard } from "./stats-card";

describe("StatsCard", () => {
  it("renders basic card with title and value", () => {
    render(<StatsCard title="Total Reservas" value={42} />);

    expect(screen.getByText("Total Reservas")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders string value correctly", () => {
    render(<StatsCard title="Ingresos" value="$1,234.56" />);

    expect(screen.getByText("Ingresos")).toBeInTheDocument();
    expect(screen.getByText("$1,234.56")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(
      <StatsCard
        title="Total Reservas"
        value={42}
        subtitle="Últimos 30 días"
      />,
    );

    expect(screen.getByText("Últimos 30 días")).toBeInTheDocument();
  });

  it("does not render subtitle when not provided", () => {
    render(<StatsCard title="Total Reservas" value={42} />);

    expect(screen.queryByText("Últimos 30 días")).not.toBeInTheDocument();
  });

  it("renders positive trend correctly", () => {
    render(
      <StatsCard
        title="Total Reservas"
        value={42}
        trend={{ value: 15, isPositive: true }}
      />,
    );

    expect(screen.getByText(/↑/)).toBeInTheDocument();
    expect(screen.getByText(/15%/)).toBeInTheDocument();
    expect(screen.getByText("vs mes anterior")).toBeInTheDocument();
  });

  it("renders negative trend correctly", () => {
    render(
      <StatsCard
        title="Total Reservas"
        value={42}
        trend={{ value: -10, isPositive: false }}
      />,
    );

    expect(screen.getByText(/↓/)).toBeInTheDocument();
    expect(screen.getByText(/10%/)).toBeInTheDocument();
    expect(screen.getByText("vs mes anterior")).toBeInTheDocument();
  });

  it("handles negative trend value with Math.abs", () => {
    render(
      <StatsCard
        title="Total Reservas"
        value={42}
        trend={{ value: -25, isPositive: false }}
      />,
    );

    // Should show absolute value
    expect(screen.getByText(/25%/)).toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    const icon = (
      <svg data-testid="test-icon" viewBox="0 0 24 24">
        <path d="M12 12" />
      </svg>
    );

    render(<StatsCard title="Total Reservas" value={42} icon={icon} />);

    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  it("does not render icon when not provided", () => {
    render(<StatsCard title="Total Reservas" value={42} />);

    expect(screen.queryByTestId("test-icon")).not.toBeInTheDocument();
  });

  it("handles zero value", () => {
    render(<StatsCard title="Total Reservas" value={0} />);

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("handles large numbers", () => {
    render(<StatsCard title="Total Reservas" value={999999} />);

    expect(screen.getByText("999999")).toBeInTheDocument();
  });

  it("renders all props together", () => {
    const icon = <svg data-testid="test-icon" />;

    render(
      <StatsCard
        title="Total Reservas"
        value={42}
        subtitle="Últimos 30 días"
        trend={{ value: 15, isPositive: true }}
        icon={icon}
      />,
    );

    expect(screen.getByText("Total Reservas")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Últimos 30 días")).toBeInTheDocument();
    expect(screen.getByText(/↑/)).toBeInTheDocument();
    expect(screen.getByText(/15%/)).toBeInTheDocument();
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });
});
