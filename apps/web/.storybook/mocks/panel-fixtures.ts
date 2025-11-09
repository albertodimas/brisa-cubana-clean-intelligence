import type {
  Booking,
  Customer,
  Lead,
  Notification,
  PaginatedResult,
  PaginationInfo,
  Property,
  Service,
  User,
} from "@/lib/api";
import type { ActionResult } from "@/lib/types";

const basePageInfo = (hasMore = false): PaginationInfo => ({
  limit: 5,
  cursor: null,
  nextCursor: hasMore ? "cursor-next" : null,
  hasMore,
});

export const mockServices: Service[] = [
  {
    id: "svc-turnover",
    name: "Turnover Premium",
    description: "Staging completo + night shift media",
    basePrice: 450,
    durationMin: 240,
    active: true,
    updatedAt: "2025-10-10T10:00:00.000Z",
  },
  {
    id: "svc-express",
    name: "Express 3h",
    description: "Para aperturas urgentes",
    basePrice: 280,
    durationMin: 180,
    active: false,
    updatedAt: "2025-10-01T08:00:00.000Z",
  },
];

export const mockProperties: Property[] = [
  {
    id: "prop-brickell",
    label: "Brickell Collection 502",
    addressLine: "88 SW 7th St",
    city: "Miami",
    state: "FL",
    zipCode: "33130",
    type: "RESIDENTIAL",
    ownerId: "cus-maria",
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1480,
    notes: "Entrega 4pm puntual",
    owner: {
      id: "cus-maria",
      email: "maria@example.com",
      fullName: "Maria Velázquez",
    },
  },
  {
    id: "prop-south-beach",
    label: "South Beach Loft",
    addressLine: "100 Ocean Dr",
    city: "Miami Beach",
    state: "FL",
    zipCode: "33139",
    type: "VACATION_RENTAL",
    ownerId: "cus-luxe",
    owner: {
      id: "cus-luxe",
      email: "vip@luxe.com",
      fullName: "Luxe Rentals",
    },
  },
];

export const mockCustomers: Customer[] = [
  {
    id: "cus-maria",
    email: "maria@example.com",
    fullName: "Maria Velázquez",
  },
  {
    id: "cus-luxe",
    email: "vip@luxe.com",
    fullName: "Luxe Rentals Miami",
  },
];

export const mockUsers: User[] = [
  {
    id: "usr-admin",
    email: "ops@brisacubana.com",
    fullName: "Equipo Operaciones",
    role: "ADMIN",
    isActive: true,
    createdAt: "2025-08-10T12:00:00.000Z",
    updatedAt: "2025-10-01T12:00:00.000Z",
  },
  {
    id: "usr-carla",
    email: "carla@brisacubana.com",
    fullName: "Carla Supervisor",
    role: "COORDINATOR",
    isActive: true,
    createdAt: "2025-07-01T12:00:00.000Z",
    updatedAt: "2025-09-15T12:00:00.000Z",
  },
  {
    id: "usr-night",
    email: "nightshift@brisacubana.com",
    fullName: "Night Shift Crew",
    role: "STAFF",
    isActive: false,
    createdAt: "2025-05-01T12:00:00.000Z",
    updatedAt: "2025-09-01T12:00:00.000Z",
  },
];

export const mockStaffUsers: User[] = mockUsers.filter((user) =>
  ["COORDINATOR", "STAFF"].includes(user.role),
);

export const mockBookings: Booking[] = [
  {
    id: "book-1",
    code: "BRISA-001",
    scheduledAt: "2025-11-12T15:00:00.000Z",
    durationMin: 240,
    totalAmount: 950,
    status: "IN_PROGRESS",
    notes: "Video obligatorio",
    service: {
      id: mockServices[0].id,
      name: mockServices[0].name,
      basePrice: mockServices[0].basePrice,
    },
    property: {
      id: mockProperties[0].id,
      label: mockProperties[0].label,
      city: mockProperties[0].city,
    },
    customer: {
      id: mockCustomers[0].id,
      fullName: mockCustomers[0].fullName,
      email: mockCustomers[0].email,
    },
    assignedStaff: {
      id: mockStaffUsers[0].id,
      email: mockStaffUsers[0].email,
      fullName: mockStaffUsers[0].fullName,
      role: mockStaffUsers[0].role,
      isActive: mockStaffUsers[0].isActive,
    },
  },
  {
    id: "book-2",
    code: "BRISA-002",
    scheduledAt: "2025-11-13T11:00:00.000Z",
    durationMin: 180,
    totalAmount: 650,
    status: "PENDING",
    service: {
      id: mockServices[1].id,
      name: mockServices[1].name,
      basePrice: mockServices[1].basePrice,
    },
    property: {
      id: mockProperties[1].id,
      label: mockProperties[1].label,
      city: mockProperties[1].city,
    },
    customer: {
      id: mockCustomers[1].id,
      fullName: mockCustomers[1].fullName,
      email: mockCustomers[1].email,
    },
  },
];

export const mockLeads: Lead[] = [
  {
    id: "lead-1",
    name: "Andrea P",
    email: "andrea@boutiquehomes.io",
    phone: "+1 786 222 1000",
    company: "Boutique Homes",
    propertyCount: "6-15 unidades",
    serviceInterest: "Turnover Premium",
    planCode: "turnover",
    notes: "Necesitan night shift media para 4 propiedades",
    status: "CONTACTED",
    utmSource: "ads",
    utmMedium: "ppc",
    utmCampaign: "ga-beta",
    utmContent: null,
    utmTerm: null,
    createdAt: "2025-11-05T15:00:00.000Z",
    updatedAt: "2025-11-05T16:00:00.000Z",
  },
  {
    id: "lead-2",
    name: "Pablo Rentería",
    email: "pablo@staybrickell.com",
    status: "NEW",
    serviceInterest: "Deep Clean Brickell",
    planCode: "deep-clean",
    propertyCount: "16-40 unidades",
    notes: null,
    company: "StayBrickell",
    phone: null,
    utmSource: "organic",
    utmMedium: "seo",
    utmCampaign: null,
    utmContent: null,
    utmTerm: null,
    createdAt: "2025-11-09T19:00:00.000Z",
    updatedAt: "2025-11-09T19:00:00.000Z",
  },
];

export const mockNotifications: PaginatedResult<Notification> = {
  items: [
    {
      id: "notif-1",
      type: "booking",
      message: "Reserva BRISA-001 actualizada por Carla",
      readAt: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: "notif-2",
      type: "lead",
      message: "Nuevo lead de StayBrickell",
      readAt: "2025-11-08T12:00:00.000Z",
      createdAt: "2025-11-08T10:15:00.000Z",
    },
  ],
  pageInfo: basePageInfo(false),
};

export const paginatedServices: PaginatedResult<Service> = {
  items: mockServices,
  pageInfo: basePageInfo(true),
};

export const paginatedProperties: PaginatedResult<Property> = {
  items: mockProperties,
  pageInfo: basePageInfo(false),
};

export const paginatedBookings: PaginatedResult<Booking> = {
  items: mockBookings,
  pageInfo: basePageInfo(true),
};

export const paginatedCustomers: PaginatedResult<Customer> = {
  items: mockCustomers,
  pageInfo: basePageInfo(false),
};

export const paginatedUsers: PaginatedResult<User> = {
  items: mockUsers,
  pageInfo: basePageInfo(false),
};

export const paginatedLeads: PaginatedResult<Lead> = {
  items: mockLeads,
  pageInfo: basePageInfo(true),
};

export const asyncSuccess =
  (message: string) =>
  async (..._args: unknown[]): Promise<ActionResult> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    console.info("[storybook]", message);
    return { success: message };
  };

export const asyncError =
  (message: string) =>
  async (..._args: unknown[]): Promise<ActionResult> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    console.warn("[storybook]", message);
    return { error: message };
  };

export const noopAsync = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
};

export const defaultPageInfo = basePageInfo(true);
