// API response types matching backend schema

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "PENDING_PAYMENT" | "PAID" | "FAILED" | "REFUNDED";

export type PropertyType =
  | "RESIDENTIAL"
  | "VACATION_RENTAL"
  | "OFFICE"
  | "HOSPITALITY";

export interface Service {
  id: string;
  name: string;
  description: string | null;
  basePrice: string;
  duration: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  type: PropertyType;
  size: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
  _count?: {
    bookings: number;
  };
}

export interface Booking {
  id: string;
  userId: string;
  propertyId: string;
  serviceId: string;
  scheduledAt: string;
  completedAt: string | null;
  status: BookingStatus;
  totalPrice: string;
  notes: string | null;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  service: {
    id: string;
    name: string;
    duration?: number;
  };
  property: {
    id: string;
    name: string;
    address: string;
  };
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}
