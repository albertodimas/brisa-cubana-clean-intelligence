import React from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Booking, PaginationInfo, Property, Service } from "@/lib/api";
import { BookingsManager } from "./bookings-manager";

type BookingFilterInput = {
  status: string;
  from: string;
  to: string;
};

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

const services: Service[] = [
  {
    id: "svc-1",
    name: "Turnover",
    description: null,
    basePrice: 140,
    durationMin: 90,
    active: true,
    updatedAt: "2025-10-10T10:00:00.000Z",
  },
];

const properties: Property[] = [
  {
    id: "prop-1",
    label: "Midtown Condo",
    addressLine: "44 NE 1st Ave",
    city: "Miami",
    state: "FL",
    zipCode: "33132",
    type: "RESIDENTIAL",
    ownerId: "cus-1",
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1100,
    notes: null,
    owner: { id: "cus-1", email: "client@example.com", fullName: "Client" },
  },
];

const bookings: Booking[] = [
  {
    id: "book-1",
    code: "BRISA-0001",
    scheduledAt: "2025-10-15T15:00:00.000Z",
    durationMin: 90,
    totalAmount: 140,
    status: "PENDING",
    notes: null,
    service: { id: services[0].id, name: services[0].name, basePrice: 140 },
    property: {
      id: properties[0].id,
      label: properties[0].label,
      city: properties[0].city,
    },
    customer: {
      id: "cus-1",
      fullName: "Maria Client",
      email: "client@example.com",
    },
  },
];

const pageInfo: PaginationInfo = {
  limit: 10,
  cursor: null,
  nextCursor: "cursor-next",
  hasMore: true,
};

const filters: BookingFilterInput = {
  status: "ALL",
  from: "",
  to: "",
};

describe("BookingsManager", () => {
  it("renders skeletons while loading", () => {
    render(
      <BookingsManager
        filters={filters}
        onFiltersChange={vi.fn()}
        bookings={bookings}
        pageInfo={pageInfo}
        isLoading
        isLoadingMore={false}
        onLoadMore={vi.fn()}
        onUpdate={vi.fn()}
        updatingId={null}
        services={services}
        properties={properties}
        formatDateTime={(value) => value}
      />,
    );

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("calls filters change handler when status select changes", async () => {
    const onFiltersChange = vi.fn();
    const user = userEvent.setup();

    render(
      <BookingsManager
        filters={filters}
        onFiltersChange={onFiltersChange}
        bookings={bookings}
        pageInfo={pageInfo}
        isLoading={false}
        isLoadingMore={false}
        onLoadMore={vi.fn()}
        onUpdate={vi.fn()}
        updatingId={null}
        services={services}
        properties={properties}
        formatDateTime={(value) => value}
      />,
    );

    const statusSelect = screen.getByTestId(
      "booking-status-filter",
    ) as HTMLSelectElement;
    await user.selectOptions(statusSelect, "CONFIRMED");

    expect(onFiltersChange).toHaveBeenCalledWith({ status: "CONFIRMED" });
  });

  it("disables submit button when booking is updating", () => {
    render(
      <BookingsManager
        filters={filters}
        onFiltersChange={vi.fn()}
        bookings={bookings}
        pageInfo={pageInfo}
        isLoading={false}
        isLoadingMore={false}
        onLoadMore={vi.fn()}
        onUpdate={vi.fn()}
        updatingId="book-1"
        services={services}
        properties={properties}
        formatDateTime={(value) => value}
      />,
    );

    const form = screen.getByTestId("booking-card");
    const submit = within(form).getByRole("button", { name: "Guardando..." });
    expect(submit).toBeDisabled();
  });

  it("invokes load more callback when button clicked", async () => {
    const onLoadMore = vi.fn();
    const user = userEvent.setup();

    render(
      <BookingsManager
        filters={filters}
        onFiltersChange={vi.fn()}
        bookings={bookings}
        pageInfo={{ ...pageInfo, hasMore: true }}
        isLoading={false}
        isLoadingMore={false}
        onLoadMore={onLoadMore}
        onUpdate={vi.fn()}
        updatingId={null}
        services={services}
        properties={properties}
        formatDateTime={(value) => value}
      />,
    );

    const button = screen.getByRole("button", { name: "Cargar más reservas" });
    await user.click(button);

    expect(onLoadMore).toHaveBeenCalled();
  });

  it("submits booking update form via action handler", async () => {
    const onUpdate = vi
      .fn<(bookingId: string, formData: FormData) => Promise<void>>()
      .mockResolvedValue(undefined);

    render(
      <BookingsManager
        filters={filters}
        onFiltersChange={vi.fn()}
        bookings={bookings}
        pageInfo={pageInfo}
        isLoading={false}
        isLoadingMore={false}
        onLoadMore={vi.fn()}
        onUpdate={onUpdate}
        updatingId={null}
        services={services}
        properties={properties}
        formatDateTime={(value) => value}
      />,
    );

    const form = screen.getByTestId("booking-card") as HTMLFormElement;
    const action = getFormAction(form);
    if (!action) throw new Error("Missing booking form action");

    await act(async () => {
      const data = new FormData();
      data.set("bookingNotes", "Nueva nota");
      await action(data);
    });

    expect(onUpdate).toHaveBeenCalledWith("book-1", expect.any(FormData));
  });
});
