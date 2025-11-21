import type { Meta, StoryObj } from "@storybook/react";
import type { Session } from "next-auth";
import { AdminPanel } from "./admin-panel";
import { ToastProvider } from "./ui/toast";
import {
  asyncSuccess,
  paginatedBookings,
  paginatedCustomers,
  paginatedLeads,
  paginatedProperties,
  paginatedServices,
  paginatedUsers,
  mockNotifications,
  mockStaffUsers,
} from "../.storybook/mocks/panel-fixtures";
import type { ActionResult } from "@/lib/types";

const adminUser: Session["user"] = {
  id: "usr-admin",
  email: "ops@brisacubana.com",
  role: "ADMIN",
  name: "Equipo Operaciones",
};

const coordinatorUser: Session["user"] = {
  id: "usr-carla",
  email: "carla@brisacubana.com",
  role: "COORDINATOR",
  name: "Carla Supervisor",
};

const assignStaff = async (
  bookingId: string,
  staffId: string | null,
): Promise<ActionResult> => {
  console.info("[storybook] assign staff", bookingId, staffId);
  return { success: staffId ? "Staff asignado" : "Staff desasignado" };
};

type AdminPanelProps = React.ComponentProps<typeof AdminPanel>;
type AdminPanelStoryArgs = Partial<AdminPanelProps>;

const defaultProps: AdminPanelProps = {
  currentUser: adminUser,
  services: paginatedServices,
  properties: paginatedProperties,
  bookings: paginatedBookings,
  customers: paginatedCustomers,
  staffUsers: mockStaffUsers,
  initialBookingFilters: { status: "IN_PROGRESS" },
  createService: asyncSuccess("Servicio creado"),
  createProperty: asyncSuccess("Propiedad creada"),
  createBooking: asyncSuccess("Reserva creada"),
  toggleService: asyncSuccess("Servicio actualizado"),
  updateService: asyncSuccess("Servicio editado"),
  updateProperty: asyncSuccess("Propiedad editada"),
  updateBooking: asyncSuccess("Reserva actualizada"),
  assignStaffToBooking: assignStaff,
  users: paginatedUsers,
  notifications: mockNotifications,
  updateUser: asyncSuccess("Usuario actualizado"),
  toggleUserActive: asyncSuccess("Estado actualizado"),
  logout: asyncSuccess("Sesión cerrada"),
  leads: paginatedLeads,
  updateLead: asyncSuccess("Lead actualizado"),
  isLoading: false,
};

function AdminPanelPreview(
  props: Partial<React.ComponentProps<typeof AdminPanel>> = {},
) {
  const merged: React.ComponentProps<typeof AdminPanel> = {
    ...defaultProps,
    ...props,
    staffUsers: props.staffUsers ?? mockStaffUsers,
    createService: props.createService ?? defaultProps.createService,
    createProperty: props.createProperty ?? defaultProps.createProperty,
    createBooking: props.createBooking ?? defaultProps.createBooking,
    toggleService: props.toggleService ?? defaultProps.toggleService,
    updateService: props.updateService ?? defaultProps.updateService,
    updateProperty: props.updateProperty ?? defaultProps.updateProperty,
    updateBooking: props.updateBooking ?? defaultProps.updateBooking,
    assignStaffToBooking:
      props.assignStaffToBooking ?? defaultProps.assignStaffToBooking,
    updateUser: props.updateUser ?? defaultProps.updateUser,
    toggleUserActive: props.toggleUserActive ?? defaultProps.toggleUserActive,
    logout: props.logout ?? defaultProps.logout,
    updateLead: props.updateLead ?? defaultProps.updateLead,
    isLoading: props.isLoading ?? defaultProps.isLoading,
    services: props.services ?? defaultProps.services,
    properties: props.properties ?? defaultProps.properties,
    bookings: props.bookings ?? defaultProps.bookings,
    customers: props.customers ?? defaultProps.customers,
    users: props.users ?? defaultProps.users,
    notifications: props.notifications ?? defaultProps.notifications,
    leads: props.leads ?? defaultProps.leads,
    currentUser: props.currentUser ?? defaultProps.currentUser,
    initialBookingFilters:
      props.initialBookingFilters ?? defaultProps.initialBookingFilters,
  };

  return (
    <ToastProvider>
      <AdminPanel {...merged} />
    </ToastProvider>
  );
}

const meta: Meta<AdminPanelStoryArgs> = {
  title: "Managers/AdminPanel",
  component: AdminPanel,
  render: (args) => <AdminPanelPreview {...args} />,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<AdminPanelStoryArgs>;

export const Default: Story = { args: {} };

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const CoordinatorView: Story = {
  args: {
    currentUser: coordinatorUser,
  },
};
