import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { QueryParams } from "@/hooks/use-paginated-resource";
import type { User, PaginationInfo } from "@/lib/api";
import { UsersManager } from "./users-manager";

const baseUser: User = {
  id: "user-1",
  email: "admin@example.com",
  fullName: "Admin Demo",
  role: "ADMIN",
  isActive: true,
  createdAt: "2025-10-10T10:00:00.000Z",
  updatedAt: "2025-10-10T10:00:00.000Z",
};

const pageInfo: PaginationInfo = {
  limit: 50,
  cursor: null,
  nextCursor: null,
  hasMore: false,
};

function renderManager(
  overrides: Partial<React.ComponentProps<typeof UsersManager>> = {},
) {
  const setQuery = vi
    .fn<(query: QueryParams) => Promise<void>>()
    .mockResolvedValue();
  const resetQuery = vi.fn().mockResolvedValue(undefined);
  const refresh = vi.fn().mockResolvedValue(undefined);
  const onUpdate = vi
    .fn<
      (
        userId: string,
        formData: FormData,
      ) => Promise<{ success?: string; error?: string }>
    >()
    .mockResolvedValue({ success: "Actualizado" });
  const onToggleActive = vi
    .fn<
      (
        userId: string,
        active: boolean,
      ) => Promise<{ success?: string; error?: string }>
    >()
    .mockResolvedValue({ success: "Estado actualizado" });
  const onToast = vi.fn();

  const props: React.ComponentProps<typeof UsersManager> = {
    users: [baseUser],
    pageInfo,
    isLoading: false,
    isLoadingMore: false,
    onLoadMore: vi.fn(),
    currentQuery: {} as QueryParams,
    setQuery,
    resetQuery,
    refresh,
    onUpdate,
    onToggleActive,
    currentUserId: null,
    onToast,
    ...overrides,
  };

  const utils = render(<UsersManager {...props} />);
  return {
    utils,
    setQuery,
    resetQuery,
    refresh,
    onUpdate,
    onToggleActive,
    onToast,
    props,
  };
}

describe("UsersManager", () => {
  it("updates query when search changes", async () => {
    const { setQuery } = renderManager();
    const user = userEvent.setup();

    const input = screen.getByRole("searchbox", { name: /Buscar usuarios/i });
    await user.type(input, "coordinador");

    await waitFor(() => {
      expect(setQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: "coordinador" }),
      );
    });
  });

  it("updates query when role and status filters change", async () => {
    const { setQuery } = renderManager();
    const user = userEvent.setup();

    const roleSelect = screen.getByLabelText("Filtrar por rol");
    await user.selectOptions(roleSelect, "COORDINATOR");

    await waitFor(() => {
      expect(setQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({ role: "COORDINATOR" }),
      );
    });

    const statusSelect = screen.getByLabelText("Filtrar por estado");
    await user.selectOptions(statusSelect, "ACTIVE");

    await waitFor(() => {
      expect(setQuery).toHaveBeenLastCalledWith(
        expect.objectContaining({ isActive: true }),
      );
    });
  });

  it("clears filters when chips are removed", async () => {
    const { setQuery, resetQuery } = renderManager({
      currentQuery: { search: "demo", role: "STAFF", isActive: false },
    });
    const user = userEvent.setup();

    const clearButton = await screen.findByRole("button", {
      name: /Limpiar todos/i,
    });
    await user.click(clearButton);

    expect(resetQuery).toHaveBeenCalled();
    await waitFor(() => {
      expect(setQuery).toHaveBeenLastCalledWith({});
    });
  });

  it("submits user update and triggers refresh with toast", async () => {
    const { onUpdate, refresh, onToast } = renderManager();
    const user = userEvent.setup();

    const form = screen
      .getByRole("button", { name: "Actualizar" })
      .closest("form");
    if (!form) throw new Error("Form not found");

    const nameInput = within(form).getByPlaceholderText("Nombre completo");
    await user.clear(nameInput);
    await user.type(nameInput, "Nuevo Nombre");

    await user.click(within(form).getByRole("button", { name: "Actualizar" }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(baseUser.id, expect.any(FormData));
    });
    await waitFor(() => {
      expect(refresh).toHaveBeenCalled();
    });
    expect(onToast).toHaveBeenCalledWith("Actualizado", "success");
  });

  it("disables toggle for current user", () => {
    renderManager({ currentUserId: baseUser.id });

    const checkbox = screen.getByLabelText("Activo");
    expect(checkbox).toBeDisabled();
  });

  it("toggles active status and refreshes data", async () => {
    const { onToggleActive, refresh, onToast } = renderManager();
    const user = userEvent.setup();

    const checkbox = screen.getByLabelText("Activo");
    await user.click(checkbox);

    await waitFor(() => {
      expect(onToggleActive).toHaveBeenCalledWith(baseUser.id, false);
    });
    await waitFor(() => {
      expect(refresh).toHaveBeenCalled();
    });
    expect(onToast).toHaveBeenCalledWith("Estado actualizado", "success");
  });
});
