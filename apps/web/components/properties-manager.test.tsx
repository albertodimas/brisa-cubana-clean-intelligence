import React from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Customer, Property, PaginationInfo } from "@/lib/api";
import { PropertiesManager } from "./properties-manager";

type ActionResult = { success?: string; error?: string };

function getFormAction(
  form: HTMLFormElement,
): ((data: FormData) => Promise<void>) | undefined {
  const reactPropsKey = Object.keys(form).find((key) =>
    key.startsWith("__reactProps$"),
  );
  if (!reactPropsKey) {
    throw new Error("Unable to resolve React action prop");
  }
  const props = (
    form as unknown as Record<
      string,
      { action?: (data: FormData) => Promise<void> }
    >
  )[reactPropsKey];
  return props?.action;
}

const customers: Customer[] = [
  { id: "cus-1", email: "owner@demo.com", fullName: "Owner Demo" },
];

const pageInfo: PaginationInfo = {
  limit: 50,
  cursor: null,
  nextCursor: null,
  hasMore: false,
};

const baseProperty: Property = {
  id: "prop-1",
  label: "Brickell Loft",
  addressLine: "123 Main St",
  city: "Miami",
  state: "FL",
  zipCode: "33101",
  type: "RESIDENTIAL",
  ownerId: "cus-1",
  bedrooms: 2,
  bathrooms: 2,
  sqft: 900,
  notes: null,
  owner: customers[0],
};

describe("PropertiesManager", () => {
  it("shows empty state message when no properties exist", () => {
    const onToast = vi.fn();

    render(
      <PropertiesManager
        properties={[]}
        customers={customers}
        createProperty={async () => ({ success: "ok" })}
        updateProperty={async () => ({ success: "ok" })}
        onToast={onToast}
        pageInfo={pageInfo}
        isLoading={false}
        isLoadingMore={false}
        onLoadMore={vi.fn()}
        onRefresh={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Aún no tienes propiedades registradas."),
    ).toBeInTheDocument();
  });

  it("invokes createProperty server action with success toast", async () => {
    const createProperty = vi
      .fn<(formData: FormData) => Promise<ActionResult>>()
      .mockResolvedValue({ success: "Propiedad creada" });
    const onToast = vi.fn();
    const onRefresh = vi.fn();

    render(
      <PropertiesManager
        properties={[]}
        customers={customers}
        createProperty={createProperty}
        updateProperty={async () => ({ success: "ok" })}
        onToast={onToast}
        pageInfo={pageInfo}
        isLoading={false}
        isLoadingMore={false}
        onLoadMore={vi.fn()}
        onRefresh={onRefresh}
      />,
    );

    const form = screen
      .getByText("Registrar propiedad")
      .closest("form") as HTMLFormElement;
    const action = getFormAction(form);
    if (!action) throw new Error("Missing form action");

    await act(async () => {
      await action(new FormData());
    });

    expect(createProperty).toHaveBeenCalledTimes(1);
    expect(onToast).toHaveBeenCalledWith("Propiedad creada", "success");
    expect(onRefresh).toHaveBeenCalled();
  });

  it("calls updateProperty and displays feedback", async () => {
    const updateProperty = vi
      .fn<(propertyId: string, formData: FormData) => Promise<ActionResult>>()
      .mockResolvedValue({ error: "Conflicto" });
    const onToast = vi.fn();
    const onRefresh = vi.fn();

    render(
      <PropertiesManager
        properties={[baseProperty]}
        customers={customers}
        createProperty={async () => ({ success: "ok" })}
        updateProperty={updateProperty}
        onToast={onToast}
        pageInfo={pageInfo}
        isLoading={false}
        isLoadingMore={false}
        onLoadMore={vi.fn()}
        onRefresh={onRefresh}
      />,
    );

    const form = screen.getByText(baseProperty.label).closest("form");
    if (!(form instanceof HTMLFormElement)) {
      throw new Error("Property form not found");
    }
    const action = getFormAction(form);
    if (!action) throw new Error("Missing form action");

    const user = userEvent.setup();
    const cityInput = within(form).getByLabelText("Ciudad") as HTMLInputElement;

    await user.clear(cityInput);
    await user.type(cityInput, "Key West");

    await act(async () => {
      const data = new FormData();
      data.set("propertyCity", "Key West");
      await action(data);
    });

    expect(updateProperty).toHaveBeenCalledWith(
      baseProperty.id,
      expect.any(FormData),
    );
    expect(onToast).toHaveBeenCalledWith("Conflicto", "error");
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("shows success toast and forwards payload on property update", async () => {
    const updateProperty = vi
      .fn<(propertyId: string, formData: FormData) => Promise<ActionResult>>()
      .mockResolvedValue({ success: "Propiedad actualizada" });
    const onToast = vi.fn();
    const onRefresh = vi.fn();

    render(
      <PropertiesManager
        properties={[baseProperty]}
        customers={customers}
        createProperty={async () => ({ success: "ok" })}
        updateProperty={updateProperty}
        onToast={onToast}
        pageInfo={pageInfo}
        isLoading={false}
        isLoadingMore={false}
        onLoadMore={vi.fn()}
        onRefresh={onRefresh}
      />,
    );

    const form = screen.getByText(baseProperty.label).closest("form");
    if (!(form instanceof HTMLFormElement)) {
      throw new Error("Property form not found");
    }
    const action = getFormAction(form);
    if (!action) throw new Error("Missing form action");

    const data = new FormData();
    data.set("propertyNotes", "Nueva nota");

    await act(async () => {
      await action(data);
    });

    expect(updateProperty).toHaveBeenCalledWith(
      baseProperty.id,
      expect.any(FormData),
    );
    expect(onToast).toHaveBeenCalledWith("Propiedad actualizada", "success");
    expect(onRefresh).toHaveBeenCalled();
  });
});
