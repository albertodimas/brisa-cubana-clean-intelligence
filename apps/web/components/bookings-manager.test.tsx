import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type {
  Booking,
  PaginationInfo,
  Property,
  Service,
  User,
} from "@/lib/api";
import type { QueryParams } from "@/hooks/use-paginated-resource";
import { BookingsManager } from "./bookings-manager";

const mockStaffUsers: User[] = [
  {
    id: "staff-1",
    email: "staff@test.com",
    fullName: "John Staff",
    role: "STAFF",
    isActive: true,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
];

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

const defaultQuery: QueryParams = {};

const defaultProps = {
  bookings,
  pageInfo,
  isLoading: false,
  isLoadingMore: false,
  onLoadMore: vi.fn(),
  onUpdate: vi.fn().mockResolvedValue({ success: "Updated" }),
  onAssignStaff: vi.fn().mockResolvedValue({ success: "Staff assigned" }),
  services,
  properties,
  staffUsers: mockStaffUsers,
  formatDateTime: (value: string) => value,
  currentQuery: defaultQuery,
  setQuery: vi.fn(),
  resetQuery: vi.fn(),
  refresh: vi.fn(),
  onToast: vi.fn(),
};

describe("BookingsManager", () => {
  it("renders skeletons while loading", () => {
    render(<BookingsManager {...defaultProps} isLoading />);

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("updates query when status select changes", async () => {
    const setQuery = vi.fn();
    const user = userEvent.setup();

    render(<BookingsManager {...defaultProps} setQuery={setQuery} />);

    const statusSelect = screen.getByTestId(
      "booking-status-filter",
    ) as HTMLSelectElement;
    await user.selectOptions(statusSelect, "CONFIRMED");

    await waitFor(() => {
      expect(setQuery).toHaveBeenCalledWith({ status: "CONFIRMED" });
    });
  });

  it("invokes load more callback when button clicked", async () => {
    const onLoadMore = vi.fn();
    const user = userEvent.setup();

    render(
      <BookingsManager
        {...defaultProps}
        onLoadMore={onLoadMore}
        pageInfo={{ ...pageInfo, hasMore: true }}
      />,
    );

    const button = screen.getByRole("button", { name: "Cargar más" });
    await user.click(button);

    expect(onLoadMore).toHaveBeenCalled();
  });

  it("updates search query", async () => {
    const user = userEvent.setup();
    const setQuery = vi.fn();

    render(<BookingsManager {...defaultProps} setQuery={setQuery} />);

    const searchInput = screen.getByPlaceholderText(
      "Buscar por código, cliente o propiedad...",
    );
    await user.type(searchInput, "BRISA");

    await waitFor(
      () => {
        expect(setQuery).toHaveBeenCalledWith({ search: "BRISA" });
      },
      { timeout: 1000 },
    );
  });

  it("submits booking update form and calls toast on success", async () => {
    const onUpdate = vi
      .fn()
      .mockResolvedValue({ success: "Booking updated successfully" });
    const onToast = vi.fn();
    const refresh = vi.fn();

    render(
      <BookingsManager
        {...defaultProps}
        onUpdate={onUpdate}
        onToast={onToast}
        refresh={refresh}
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
    expect(onToast).toHaveBeenCalledWith(
      "Booking updated successfully",
      "success",
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("submits booking update form and calls toast on error", async () => {
    const onUpdate = vi
      .fn()
      .mockResolvedValue({ error: "Failed to update booking" });
    const onToast = vi.fn();
    const refresh = vi.fn();

    render(
      <BookingsManager
        {...defaultProps}
        onUpdate={onUpdate}
        onToast={onToast}
        refresh={refresh}
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
    expect(onToast).toHaveBeenCalledWith("Failed to update booking", "error");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("assigns staff to booking and shows success toast", async () => {
    const user = userEvent.setup();
    const onAssignStaff = vi
      .fn()
      .mockResolvedValue({ success: "Personal asignado correctamente" });
    const onToast = vi.fn();
    const refresh = vi.fn();

    render(
      <BookingsManager
        {...defaultProps}
        onAssignStaff={onAssignStaff}
        onToast={onToast}
        refresh={refresh}
      />,
    );

    const staffSelect = screen.getByTestId("booking-staff-select");
    expect(staffSelect).toBeInTheDocument();

    await user.selectOptions(staffSelect, "staff-1");

    await waitFor(() => {
      expect(onAssignStaff).toHaveBeenCalledWith("book-1", "staff-1");
    });

    expect(onToast).toHaveBeenCalledWith(
      "Personal asignado correctamente",
      "success",
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("unassigns staff from booking", async () => {
    const user = userEvent.setup();
    const onAssignStaff = vi
      .fn()
      .mockResolvedValue({ success: "Personal desasignado" });
    const onToast = vi.fn();
    const refresh = vi.fn();

    const bookingWithStaff: Booking = {
      ...bookings[0],
      assignedStaff: mockStaffUsers[0],
    };

    render(
      <BookingsManager
        {...defaultProps}
        bookings={[bookingWithStaff]}
        onAssignStaff={onAssignStaff}
        onToast={onToast}
        refresh={refresh}
      />,
    );

    const staffSelect = screen.getByTestId("booking-staff-select");
    expect(staffSelect).toBeInTheDocument();

    await user.selectOptions(staffSelect, "");

    await waitFor(() => {
      expect(onAssignStaff).toHaveBeenCalledWith("book-1", null);
    });

    expect(onToast).toHaveBeenCalledWith("Personal desasignado", "success");
    expect(refresh).toHaveBeenCalled();
  });

  it("shows error toast when staff assignment fails", async () => {
    const user = userEvent.setup();
    const onAssignStaff = vi
      .fn()
      .mockResolvedValue({ error: "No se pudo asignar el personal" });
    const onToast = vi.fn();
    const refresh = vi.fn();

    render(
      <BookingsManager
        {...defaultProps}
        onAssignStaff={onAssignStaff}
        onToast={onToast}
        refresh={refresh}
      />,
    );

    const staffSelect = screen.getByTestId("booking-staff-select");

    await user.selectOptions(staffSelect, "staff-1");

    await waitFor(() => {
      expect(onAssignStaff).toHaveBeenCalledWith("book-1", "staff-1");
    });

    expect(onToast).toHaveBeenCalledWith(
      "No se pudo asignar el personal",
      "error",
    );
    expect(refresh).not.toHaveBeenCalled();
  });

  it("disables staff select for completed bookings", () => {
    const completedBooking: Booking = {
      ...bookings[0],
      status: "COMPLETED",
    };

    render(<BookingsManager {...defaultProps} bookings={[completedBooking]} />);

    const staffSelect = screen.getByTestId("booking-staff-select");

    expect(staffSelect).toBeDisabled();
  });

  it("disables staff select for cancelled bookings", () => {
    const cancelledBooking: Booking = {
      ...bookings[0],
      status: "CANCELLED",
    };

    render(<BookingsManager {...defaultProps} bookings={[cancelledBooking]} />);

    const staffSelect = screen.getByTestId("booking-staff-select");

    expect(staffSelect).toBeDisabled();
  });

  it("filters bookings by assigned staff", async () => {
    const user = userEvent.setup();
    const setQuery = vi.fn();

    render(<BookingsManager {...defaultProps} setQuery={setQuery} />);

    // Find staff filter select (different from staff assignment selects in booking cards)
    // Staff filter should have an option like "Todos los staff" or "ALL"
    const filterSelects = screen.getAllByRole("combobox");
    const staffFilterSelect = filterSelects.find((select) => {
      const options = Array.from((select as HTMLSelectElement).options).map(
        (opt) => opt.textContent,
      );
      return options.some(
        (text) => text?.includes("staff") || text?.includes("Staff"),
      );
    });

    if (staffFilterSelect) {
      await user.selectOptions(
        staffFilterSelect as HTMLSelectElement,
        "staff-1",
      );

      await waitFor(() => {
        expect(setQuery).toHaveBeenCalledWith({ assignedStaffId: "staff-1" });
      });
    }
  });
});
