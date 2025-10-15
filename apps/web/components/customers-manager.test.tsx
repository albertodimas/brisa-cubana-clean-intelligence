import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Customer, PaginationInfo } from "@/lib/api";
import { CustomersManager } from "./customers-manager";

const customers: Customer[] = [
  { id: "cus-1", email: "client@test.com", fullName: "Cliente Demo" },
];

const pageInfo: PaginationInfo = {
  limit: 50,
  cursor: null,
  nextCursor: null,
  hasMore: false,
};

function renderManager(
  overrides: Partial<React.ComponentProps<typeof CustomersManager>> = {},
) {
  const setQuery = vi
    .fn<(query: Record<string, unknown>) => Promise<void>>()
    .mockResolvedValue();
  const resetQuery = vi.fn<() => Promise<void>>().mockResolvedValue();

  const props: React.ComponentProps<typeof CustomersManager> = {
    customers,
    pageInfo,
    isLoading: false,
    isLoadingMore: false,
    onLoadMore: vi.fn(),
    currentQuery: {},
    setQuery,
    resetQuery,
    ...overrides,
  };

  const utils = render(<CustomersManager {...props} />);
  return { ...props, setQuery, resetQuery, utils };
}

describe("CustomersManager", () => {
  it("shows helper message when no customers are present", () => {
    renderManager({ customers: [] });
    expect(
      screen.getByText("No hay clientes disponibles."),
    ).toBeInTheDocument();
  });

  it("updates query when search changes", async () => {
    const user = userEvent.setup();
    const { setQuery } = renderManager();

    const input = screen.getByPlaceholderText("Buscar clientes...");
    await user.type(input, "cliente");

    await waitFor(
      () => {
        expect(setQuery).toHaveBeenCalledWith({ search: "cliente" });
      },
      { timeout: 500 },
    );
  });

  it("renders customer entries when available", () => {
    renderManager();
    expect(screen.getByText("Cliente Demo")).toBeInTheDocument();
  });
});
