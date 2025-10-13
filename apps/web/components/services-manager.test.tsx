import React from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Service } from "@/lib/api";
import { ServicesManager } from "./services-manager";

type ActionResult = { success?: string; error?: string };

function getFormAction(
  form: HTMLFormElement,
): ((data: FormData) => Promise<void>) | undefined {
  const reactPropsKey = Object.keys(form).find((key) =>
    key.startsWith("__reactProps$"),
  );
  if (!reactPropsKey) {
    throw new Error("Unable to locate React props for form");
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

const defaultCreate = async (_form: FormData): Promise<ActionResult> => ({
  success: "ok",
});

const defaultUpdate = async (
  _id: string,
  _form: FormData,
): Promise<ActionResult> => ({ success: "ok" });

const defaultToggle = async (
  _id: string,
  _active: boolean,
): Promise<ActionResult> => ({ success: "ok" });

describe("ServicesManager", () => {
  it("renders empty state when no services loaded", () => {
    const onToast = vi.fn();

    render(
      <ServicesManager
        services={[]}
        createService={defaultCreate}
        updateService={defaultUpdate}
        toggleService={defaultToggle}
        onToast={onToast}
      />,
    );

    expect(
      screen.getByText("No hay servicios configurados todavía."),
    ).toBeInTheDocument();
  });

  it("executes createService action and shows success toast", async () => {
    const createService = vi
      .fn<(formData: FormData) => Promise<ActionResult>>()
      .mockResolvedValue({ success: "Servicio creado" });
    const onToast = vi.fn();

    render(
      <ServicesManager
        services={[]}
        createService={createService}
        updateService={defaultUpdate}
        toggleService={defaultToggle}
        onToast={onToast}
      />,
    );

    const form = screen.getByTestId("service-create-form") as HTMLFormElement;
    const action = getFormAction(form);
    if (!action) throw new Error("Missing action handler");

    await act(async () => {
      await action(new FormData());
    });

    expect(createService).toHaveBeenCalledTimes(1);
    expect(onToast).toHaveBeenCalledWith("Servicio creado", "success");
  });

  it("shows error toast when createService fails", async () => {
    const createService = vi
      .fn<(formData: FormData) => Promise<ActionResult>>()
      .mockResolvedValue({ error: "Duplicado" });
    const onToast = vi.fn();

    render(
      <ServicesManager
        services={[]}
        createService={createService}
        updateService={defaultUpdate}
        toggleService={defaultToggle}
        onToast={onToast}
      />,
    );

    const form = screen.getByTestId("service-create-form") as HTMLFormElement;
    const action = getFormAction(form);
    if (!action) throw new Error("Missing action handler");

    await act(async () => {
      await action(new FormData());
    });

    expect(onToast).toHaveBeenCalledWith("Duplicado", "error");
  });

  it("toggles service state through action button", async () => {
    const toggleService = vi
      .fn<(serviceId: string, active: boolean) => Promise<ActionResult>>()
      .mockResolvedValue({ success: "Actualizado" });
    const onToast = vi.fn();

    render(
      <ServicesManager
        services={[baseService]}
        createService={defaultCreate}
        updateService={defaultUpdate}
        toggleService={toggleService}
        onToast={onToast}
      />,
    );

    const user = userEvent.setup();
    const card = screen.getByText(baseService.name).closest("form");
    if (!card) throw new Error("Service form not found");
    const toggleButton = within(card).getByRole("button", {
      name: "Desactivar",
    });

    await user.click(toggleButton);

    expect(toggleService).toHaveBeenCalledWith(baseService.id, false);
    expect(onToast).toHaveBeenCalledWith("Actualizado", "success");
  });

  it("submits inline update forms and shows toast on success", async () => {
    const updateService = vi
      .fn<(serviceId: string, formData: FormData) => Promise<ActionResult>>()
      .mockResolvedValue({ success: "Servicio actualizado" });
    const onToast = vi.fn();

    render(
      <ServicesManager
        services={[baseService]}
        createService={defaultCreate}
        updateService={updateService}
        toggleService={defaultToggle}
        onToast={onToast}
      />,
    );

    const card = screen.getByText(baseService.name).closest("form");
    if (!(card instanceof HTMLFormElement)) {
      throw new Error("Service form not found");
    }
    const action = getFormAction(card);
    if (!action) throw new Error("Missing service form action");

    const formData = new FormData();
    formData.set("serviceName", "Express Clean");

    await act(async () => {
      await action(formData);
    });

    expect(updateService).toHaveBeenCalledWith(
      baseService.id,
      expect.any(FormData),
    );
    expect(onToast).toHaveBeenCalledWith("Servicio actualizado", "success");
  });

  it("surfaces errors from inline update forms", async () => {
    const updateService = vi
      .fn<(serviceId: string, formData: FormData) => Promise<ActionResult>>()
      .mockResolvedValue({ error: "Sin cambios" });
    const onToast = vi.fn();

    render(
      <ServicesManager
        services={[baseService]}
        createService={defaultCreate}
        updateService={updateService}
        toggleService={defaultToggle}
        onToast={onToast}
      />,
    );

    const form = screen.getByText(baseService.name).closest("form");
    if (!(form instanceof HTMLFormElement)) {
      throw new Error("Service form not found");
    }
    const action = getFormAction(form);
    if (!action) throw new Error("Missing form action");

    await act(async () => {
      await action(new FormData());
    });

    expect(onToast).toHaveBeenCalledWith("Sin cambios", "error");
  });

  it("notifies errors when toggling service fails", async () => {
    const toggleService = vi
      .fn<(serviceId: string, active: boolean) => Promise<ActionResult>>()
      .mockResolvedValue({ error: "No se pudo actualizar" });
    const onToast = vi.fn();

    render(
      <ServicesManager
        services={[baseService]}
        createService={defaultCreate}
        updateService={defaultUpdate}
        toggleService={toggleService}
        onToast={onToast}
      />,
    );

    const user = userEvent.setup();
    const card = screen.getByText(baseService.name).closest("form");
    if (!card) throw new Error("Service form not found");
    const toggleButton = within(card).getByRole("button", {
      name: "Desactivar",
    });

    await user.click(toggleButton);

    expect(onToast).toHaveBeenCalledWith("No se pudo actualizar", "error");
  });
});
