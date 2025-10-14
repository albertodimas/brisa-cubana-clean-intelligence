import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "./pagination";

describe("Pagination", () => {
  it("renders load more button when more results are available", async () => {
    const onLoadMore = vi.fn();
    const user = userEvent.setup();

    render(
      <Pagination
        count={25}
        hasMore
        onLoadMore={onLoadMore}
        isLoading={false}
        label="servicios"
      />,
    );

    expect(
      screen.getByText("Mostrando 25 de 25+ servicios"),
    ).toBeInTheDocument();

    const button = screen.getByRole("button", { name: "Cargar más" });
    await user.click(button);

    expect(onLoadMore).toHaveBeenCalled();
  });

  it("shows end-of-results message when there are no more items", () => {
    render(
      <Pagination
        count={10}
        hasMore={false}
        isLoading={false}
        label="clientes"
      />,
    );

    expect(screen.getByText("Mostrando 10 clientes")).toBeInTheDocument();
    expect(screen.getByText("No hay más resultados")).toBeInTheDocument();
  });
});
