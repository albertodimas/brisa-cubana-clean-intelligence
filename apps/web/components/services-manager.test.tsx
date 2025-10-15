import React from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { PaginationInfo, Service } from "@/lib/api";
import { ServicesManager } from "./services-manager";

type ActionResult = { success?: string; error?: string };

function getFormAction(
  form: HTMLFormElement,
): ((data: FormData) => Promise<void>) | undefined {
  const reactPropsKey = Object.keys(form).find((key) =>
    key.startsWith("__reactProps$"),
  );
  if (!reactPropsKey) {
    throw new Error("Unable to locate React action props");
  }
  const props = (
    form as unknown as Record<
      string,
      { action?: (data: FormData) => Promise<void> }
    >
  )[reactPropsKey];
  return props?.action;
}

const baseService: Service = {
  id: "svc-123",
  name: "Limpieza profunda",
  description: "Incluye interiores de gabinetes",
  basePrice: 180,
  durationMin: 120,
  active: true,
  updatedAt: "2025-10-12T10:00:00.000Z",
};

const pageInfo: PaginationInfo = {
  limit: 50,
  cursor: null,
  nextCursor: null,
  hasMore: false,
};

const defaultCreate = async (): Promise<ActionResult> => ({ success: "ok" });
const defaultUpdate = async (): Promise<ActionResult> => ({ success: "ok" });
const defaultToggle = async (): Promise<ActionResult> => ({ success: "ok" });

function renderManager(
  overrides: Partial<React.ComponentProps<typeof ServicesManager>> = {},
) {
  const onToast = vi.fn();
  const onRefresh = vi.fn();
  const setQuery = vi
    .fn<(query: Record<string, unknown>) => Promise<void>>()
    .mockResolvedValue();
  const resetQuery = vi.fn<() => Promise<void>>().mockResolvedValue();
  const props: React.ComponentProps<typeof ServicesManager> = {
    services: [],
    createService: defaultCreate,
    updateService: defaultUpdate,
    toggleService: defaultToggle,
    onToast,
    pageInfo,
    isLoading: false,
    isLoadingMore: false,
    onLoadMore: vi.fn(),
    onRefresh,
    currentQuery: {},
    setQuery,
    resetQuery,
    ...overrides,
  };

  const utils = render(<ServicesManager {...props} />);
  return { ...props, onToast, onRefresh, setQuery, resetQuery, utils };
}

describe("ServicesManager", () => {
  it("renders fallback when list is empty", () => {
    const { onToast } = renderManager();
    expect(onToast).not.toHaveBeenCalled();
    expect(
      screen.getByText("No hay servicios configurados todavía."),
    ).toBeInTheDocument();
  });

  it("executes createService action and refreshes data on success", async () => {
    const createService = vi
      .fn<(formData: FormData) => Promise<ActionResult>>()
      .mockResolvedValue({ success: "Servicio creado" });
    const { onToast, onRefresh } = renderManager({
      createService,
    });

    const form = screen.getByTestId("service-create-form") as HTMLFormElement;
    const action = getFormAction(form);
    if (!action) throw new Error("Missing form action");

    await act(async () => {
      await action(new FormData());
    });

    expect(createService).toHaveBeenCalledTimes(1);
    expect(onToast).toHaveBeenCalledWith("Servicio creado", "success");
    expect(onRefresh).toHaveBeenCalled();
  });

  it("propagates errors from createService without refreshing", async () => {
    const createService = vi
      .fn<(formData: FormData) => Promise<ActionResult>>()
      .mockResolvedValue({ error: "Duplicado" });
    const { onToast, onRefresh } = renderManager({ createService });

    const form = screen.getByTestId("service-create-form") as HTMLFormElement;
    const action = getFormAction(form);
    if (!action) throw new Error("Missing form action");

    await act(async () => {
      await action(new FormData());
    });

    expect(onToast).toHaveBeenCalledWith("Duplicado", "error");
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("invokes update flow and triggers refresh on success", async () => {
    const updateService = vi
      .fn<(serviceId: string, formData: FormData) => Promise<ActionResult>>()
      .mockResolvedValue({ success: "Servicio actualizado" });
    const { onToast, onRefresh } = renderManager({
      services: [baseService],
      updateService,
    });

    const card = screen.getByText(baseService.name).closest("form");
    if (!(card instanceof HTMLFormElement)) {
      throw new Error("Service form not found");
    }
    const action = getFormAction(card);
    if (!action) throw new Error("Missing service action");

    await act(async () => {
      await action(new FormData());
    });

    expect(updateService).toHaveBeenCalledWith(
      baseService.id,
      expect.any(FormData),
    );
    expect(onToast).toHaveBeenCalledWith("Servicio actualizado", "success");
    expect(onRefresh).toHaveBeenCalled();
  });

  it("does not refresh when update fails", async () => {
    const updateService = vi
      .fn<(serviceId: string, formData: FormData) => Promise<ActionResult>>()
      .mockResolvedValue({ error: "Sin cambios" });
    const { onToast, onRefresh } = renderManager({
      services: [baseService],
      updateService,
    });

    const card = screen.getByText(baseService.name).closest("form");
    if (!(card instanceof HTMLFormElement)) {
      throw new Error("Service form not found");
    }
    const action = getFormAction(card);
    if (!action) throw new Error("Missing service action");

    await act(async () => {
      await action(new FormData());
    });

    expect(onToast).toHaveBeenCalledWith("Sin cambios", "error");
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("toggles service availability and requests refresh on success", async () => {
    const toggleService = vi
      .fn<(serviceId: string, active: boolean) => Promise<ActionResult>>()
      .mockResolvedValue({ success: "Actualizado" });
    const { onToast, onRefresh } = renderManager({
      services: [baseService],
      toggleService,
    });

    const user = userEvent.setup();
    const card = screen.getByText(baseService.name).closest("form");
    if (!card) throw new Error("Service form not found");
    const toggleButton = within(card).getByRole("button", {
      name: "Desactivar",
    });

    await user.click(toggleButton);

    expect(toggleService).toHaveBeenCalledWith(baseService.id, false);
    expect(onToast).toHaveBeenCalledWith("Actualizado", "success");
    expect(onRefresh).toHaveBeenCalled();
  });

  it("surfaces toggle errors without refreshing data", async () => {
    const toggleService = vi
      .fn<(serviceId: string, active: boolean) => Promise<ActionResult>>()
      .mockResolvedValue({ error: "No se pudo actualizar" });
    const { onToast, onRefresh } = renderManager({
      services: [baseService],
      toggleService,
    });

    const user = userEvent.setup();
    const card = screen.getByText(baseService.name).closest("form");
    if (!card) throw new Error("Service form not found");
    const toggleButton = within(card).getByRole("button", {
      name: "Desactivar",
    });

    await user.click(toggleButton);

    expect(onToast).toHaveBeenCalledWith("No se pudo actualizar", "error");
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("updates query when search term changes", async () => {
    const user = userEvent.setup();
    const { setQuery } = renderManager();

    const input = screen.getByPlaceholderText("Buscar servicios...");
    await user.type(input, "limpieza");

    await waitFor(
      () => {
        expect(setQuery).toHaveBeenCalledWith({ search: "limpieza" });
      },
      { timeout: 500 },
    );
  });

  it("updates query when active filter changes", async () => {
    const user = userEvent.setup();
    const { setQuery } = renderManager();

    const select = screen.getByLabelText("Estado");
    await user.selectOptions(select, "true");

    expect(setQuery).toHaveBeenCalledWith({ active: true });
  });
});
