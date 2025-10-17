import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { FilterChip } from "./filter-chips";
import { FilterChips } from "./filter-chips";

const filters: FilterChip[] = [
  { key: "search", label: "Búsqueda", value: "profunda" },
  { key: "active", label: "Estado", value: "Activo" },
];

describe("FilterChips", () => {
  it("renders chips for each filter", () => {
    render(
      <FilterChips filters={filters} onRemove={vi.fn()} onClearAll={vi.fn()} />,
    );

    expect(
      screen.getByText(
        (_, element) => element?.textContent === "Búsqueda: profunda",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) => element?.textContent === "Estado: Activo",
      ),
    ).toBeInTheDocument();
  });

  it("invokes onRemove when chip remove button is clicked", async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();

    render(<FilterChips filters={[filters[0]]} onRemove={onRemove} />);

    const removeButton = screen.getByRole("button", {
      name: /Quitar filtro Búsqueda/i,
    });
    await user.click(removeButton);

    expect(onRemove).toHaveBeenCalledWith("search");
  });

  it("invokes onClearAll when the clear button is pressed", async () => {
    const onClearAll = vi.fn();
    const user = userEvent.setup();

    render(
      <FilterChips
        filters={filters}
        onRemove={vi.fn()}
        onClearAll={onClearAll}
        clearAllTestId="filters-clear-button"
      />,
    );

    const clearButton = screen.getByTestId("filters-clear-button");
    await user.click(clearButton);

    expect(onClearAll).toHaveBeenCalled();
  });
});
