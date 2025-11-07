import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExportButton } from "../export-button";

// Mock papaparse
vi.mock("papaparse", () => ({
  default: {
    unparse: vi.fn((_data) => "mocked,csv,data"),
  },
}));

// Mock useAnalytics hook
vi.mock("@/hooks/use-analytics", () => ({
  useAnalytics: () => ({
    trackEvent: vi.fn(),
    getEvents: vi.fn(() => []),
    clearEvents: vi.fn(),
  }),
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = vi.fn();

// Clear mocks between tests
beforeEach(async () => {
  const Papa = await import("papaparse");
  vi.clearAllMocks();
  (Papa.default.unparse as any).mockReturnValue("mocked,csv,data");
});

describe("ExportButton", () => {
  const mockData = [
    { id: "1", name: "Test Item 1", value: 100 },
    { id: "2", name: "Test Item 2", value: 200 },
    { id: "3", name: "Test Item 3", value: 300 },
  ];

  const mockColumns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Nombre" },
    {
      key: "value",
      label: "Valor",
      transform: (item: (typeof mockData)[0]) => `$${item.value}`,
    },
  ];

  it("renders button with default text", () => {
    render(
      <ExportButton
        data={mockData}
        filename="test-export"
        columns={mockColumns}
      />,
    );

    expect(
      screen.getByRole("button", { name: /exportar.*csv/i }),
    ).toBeInTheDocument();
  });

  it("is disabled when disabled prop is true", () => {
    render(
      <ExportButton
        data={mockData}
        filename="test-export"
        columns={mockColumns}
        disabled={true}
      />,
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("is disabled when data is empty", () => {
    render(
      <ExportButton data={[]} filename="test-export" columns={mockColumns} />,
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("shows tooltip when data is empty", () => {
    render(
      <ExportButton data={[]} filename="test-export" columns={mockColumns} />,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("title", "No hay datos para exportar");
  });

  it("shows max rows warning when data exceeds limit", () => {
    const largeData = Array.from({ length: 15000 }, (_, i) => ({
      id: `${i}`,
      name: `Item ${i}`,
      value: i,
    }));

    render(
      <ExportButton
        data={largeData}
        filename="test-export"
        columns={mockColumns}
        maxRows={10000}
      />,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute(
      "title",
      "Se exportarán los primeros 10.000 registros",
    );
    expect(screen.getByText("(10.000)")).toBeInTheDocument();
  });

  it("triggers CSV download when clicked", async () => {
    const user = userEvent.setup();
    const Papa = await import("papaparse");

    render(
      <ExportButton
        data={mockData}
        filename="test-export"
        columns={mockColumns}
      />,
    );

    const button = screen.getByRole("button");
    await user.click(button);

    // Verify Papa.unparse was called (CSV generation)
    await waitFor(() => {
      expect(Papa.default.unparse).toHaveBeenCalled();
    });
  });

  it("shows export button text", async () => {
    render(
      <ExportButton
        data={mockData}
        filename="test-export"
        columns={mockColumns}
      />,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveTextContent(/exportar csv/i);
  });

  it("respects custom maxRows limit", async () => {
    const user = userEvent.setup();
    const Papa = await import("papaparse");

    const largeData = Array.from({ length: 100 }, (_, i) => ({
      id: `${i}`,
      name: `Item ${i}`,
      value: i,
    }));

    render(
      <ExportButton
        data={largeData}
        filename="test-export"
        columns={mockColumns}
        maxRows={50}
      />,
    );

    const button = screen.getByRole("button");
    await user.click(button);

    await waitFor(() => {
      // Papa.unparse should be called with only 50 rows
      expect(Papa.default.unparse).toHaveBeenCalled();
      const callArgs = (Papa.default.unparse as any).mock.calls[0][0];
      expect(callArgs.length).toBe(50);
    });
  });

  it("applies transform functions to columns", async () => {
    const user = userEvent.setup();
    const Papa = await import("papaparse");

    render(
      <ExportButton
        data={mockData}
        filename="test-export"
        columns={mockColumns}
      />,
    );

    const button = screen.getByRole("button");
    await user.click(button);

    await waitFor(() => {
      expect(Papa.default.unparse).toHaveBeenCalled();
      const callArgs = (Papa.default.unparse as any).mock.calls[0][0];

      // Check that transform was applied to the "Valor" column
      expect(callArgs[0].Valor).toBe("$100");
      expect(callArgs[1].Valor).toBe("$200");
      expect(callArgs[2].Valor).toBe("$300");
    });
  });

  it("handles null and undefined values gracefully", async () => {
    const user = userEvent.setup();
    const Papa = await import("papaparse");

    const dataWithNulls = [
      { id: "1", name: null, value: undefined },
      { id: "2", name: "Test", value: 100 },
    ];

    const columns = [
      { key: "id", label: "ID" },
      { key: "name", label: "Nombre" },
      { key: "value", label: "Valor" },
    ];

    render(
      <ExportButton
        data={dataWithNulls}
        filename="test-export"
        columns={columns}
      />,
    );

    const button = screen.getByRole("button");
    await user.click(button);

    await waitFor(() => {
      expect(Papa.default.unparse).toHaveBeenCalled();
      const callArgs = (Papa.default.unparse as any).mock.calls[0][0];

      // Null and undefined should be converted to empty strings
      expect(callArgs[0].Nombre).toBe("");
      expect(callArgs[0].Valor).toBe("");
      expect(callArgs[1].Nombre).toBe("Test");
      expect(callArgs[1].Valor).toBe("100");
    });
  });

  it("shows confirmation dialog for large exports (>5000 rows)", async () => {
    const user = userEvent.setup();
    const largeData = Array.from({ length: 6000 }, (_, i) => ({
      id: `${i}`,
      name: `Item ${i}`,
      value: i,
    }));

    render(
      <ExportButton
        data={largeData}
        filename="test-export"
        columns={mockColumns}
      />,
    );

    const button = screen.getByRole("button", { name: /exportar/i });
    await user.click(button);

    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/exportación grande/i)).toBeInTheDocument();
      expect(screen.getByText(/6000 filas/i)).toBeInTheDocument();
    });
  });

  it("allows user to confirm large export", async () => {
    const user = userEvent.setup();
    const Papa = await import("papaparse");
    const largeData = Array.from({ length: 6000 }, (_, i) => ({
      id: `${i}`,
      name: `Item ${i}`,
      value: i,
    }));

    render(
      <ExportButton
        data={largeData}
        filename="test-export"
        columns={mockColumns}
      />,
    );

    const button = screen.getByRole("button", { name: /exportar/i });
    await user.click(button);

    // Click confirm button
    const confirmButton = await screen.findByRole("button", {
      name: /confirmar exportación/i,
    });
    await user.click(confirmButton);

    // Export should proceed
    await waitFor(() => {
      expect(Papa.default.unparse).toHaveBeenCalled();
    });
  });

  it("allows user to cancel large export", async () => {
    const user = userEvent.setup();
    const Papa = await import("papaparse");
    const largeData = Array.from({ length: 6000 }, (_, i) => ({
      id: `${i}`,
      name: `Item ${i}`,
      value: i,
    }));

    render(
      <ExportButton
        data={largeData}
        filename="test-export"
        columns={mockColumns}
      />,
    );

    const button = screen.getByRole("button", { name: /exportar/i });
    await user.click(button);

    // Click cancel button
    const cancelButton = await screen.findByRole("button", {
      name: /cancelar/i,
    });
    await user.click(cancelButton);

    // Export should not proceed
    expect(Papa.default.unparse).not.toHaveBeenCalled();

    // Dialog should be hidden
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not show confirmation for exports <=5000 rows", async () => {
    const user = userEvent.setup();
    const mediumData = Array.from({ length: 5000 }, (_, i) => ({
      id: `${i}`,
      name: `Item ${i}`,
      value: i,
    }));

    render(
      <ExportButton
        data={mediumData}
        filename="test-export"
        columns={mockColumns}
      />,
    );

    const button = screen.getByRole("button", { name: /exportar/i });
    await user.click(button);

    // Should not show confirmation dialog
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows row count in button text", () => {
    render(
      <ExportButton
        data={mockData}
        filename="test-export"
        columns={mockColumns}
      />,
    );

    expect(screen.getByText(/\(3\)/)).toBeInTheDocument();
  });

  it("includes resourceType in component", () => {
    render(
      <ExportButton
        data={mockData}
        filename="test-export"
        columns={mockColumns}
        resourceType="bookings"
      />,
    );

    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
