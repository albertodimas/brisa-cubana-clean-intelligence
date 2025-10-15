import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SearchBar } from "./search-bar";

describe("SearchBar", () => {
  it("renders with placeholder and value", () => {
    render(
      <SearchBar
        value="demo"
        onChange={vi.fn()}
        placeholder="Buscar servicios"
      />,
    );

    const input = screen.getByPlaceholderText(
      "Buscar servicios",
    ) as HTMLInputElement;
    expect(input.value).toBe("demo");
  });

  it("debounces the change handler", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<SearchBar value="" onChange={onChange} />);

    const input = screen.getByRole("searchbox");
    await user.type(input, "sol");

    expect(onChange).not.toHaveBeenCalled();

    await waitFor(
      () => {
        expect(onChange).toHaveBeenLastCalledWith("sol");
      },
      { timeout: 500 },
    );
  });

  it("clears the input when clear button is clicked", async () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    const user = userEvent.setup();

    render(
      <SearchBar value="limpieza" onChange={onChange} onClear={onClear} />,
    );

    const clearButton = await screen.findByRole("button", {
      name: /Limpiar búsqueda/i,
    });

    await user.click(clearButton);

    expect(onChange).toHaveBeenCalledWith("");
    expect(onClear).toHaveBeenCalled();
  });
});
