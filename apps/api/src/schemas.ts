import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce
    .number({ invalid_type_error: "page must be a number" })
    .int("page must be an integer")
    .min(1, "page must be at least 1")
    .default(1),
  limit: z.coerce
    .number({ invalid_type_error: "limit must be a number" })
    .int("limit must be an integer")
    .min(1, "limit must be at least 1")
    .max(100, "limit must be 100 or less")
    .default(10),
});

const cuidSchema = z
  .string({ required_error: "id is required" })
  .min(1, "id is required");

export const createPropertySchema = z.object({
  name: z.string().trim().min(1).max(255),
  address: z.string().trim().min(1).max(500),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  zipCode: z.string().trim().min(1).max(20),
  type: z.enum(["RESIDENTIAL", "VACATION_RENTAL", "OFFICE", "HOSPITALITY"]),
  size: z.coerce.number().int().positive().optional(),
  bedrooms: z.coerce.number().int().nonnegative().optional(),
  bathrooms: z.coerce.number().int().nonnegative().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const updatePropertySchema = createPropertySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

export const createBookingSchema = z
  .object({
    userId: cuidSchema,
    propertyId: cuidSchema,
    serviceId: cuidSchema,
    scheduledAt: z.coerce
      .date({
        invalid_type_error: "scheduledAt must be a valid ISO date",
      })
      .refine(
        (value) => !Number.isNaN(value.getTime()),
        "scheduledAt is invalid",
      ),
    totalPrice: z.coerce
      .number({ invalid_type_error: "totalPrice must be numeric" })
      .nonnegative("totalPrice cannot be negative")
      .optional(),
    notes: z
      .string({ invalid_type_error: "notes must be text" })
      .trim()
      .max(1024, "notes must be 1024 characters or less")
      .optional(),
  })
  .refine(
    (data) => {
      // Booking must be scheduled at least 2 hours in the future
      const now = new Date();
      const minScheduleTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      return data.scheduledAt >= minScheduleTime;
    },
    {
      message: "Booking must be scheduled at least 2 hours in advance from now",
      path: ["scheduledAt"],
    },
  )
  .refine(
    (data) => {
      // Don't allow bookings more than 6 months (180 days) in the future
      const now = new Date();
      const maxScheduleTime = new Date(
        now.getTime() + 180 * 24 * 60 * 60 * 1000,
      );
      return data.scheduledAt <= maxScheduleTime;
    },
    {
      message: "Booking cannot be scheduled more than 6 months in advance",
      path: ["scheduledAt"],
    },
  )
  .refine(
    (data) => {
      // If totalPrice is provided, it must be at least $50
      if (data.totalPrice !== undefined && data.totalPrice > 0) {
        return data.totalPrice >= 50;
      }
      return true;
    },
    {
      message: "Total price must be at least $50.00",
      path: ["totalPrice"],
    },
  );

export const updateBookingSchema = z
  .object({
    status: z
      .enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
      .optional(),
    notes: z
      .string({ invalid_type_error: "notes must be text" })
      .trim()
      .max(1024, "notes must be 1024 characters or less")
      .optional(),
  })
  .refine((data) => data.status !== undefined || data.notes !== undefined, {
    message: "Provide at least one field to update",
  });

export const createServiceSchema = z.object({
  name: z
    .string({ required_error: "name is required" })
    .trim()
    .min(2, "name must be at least 2 characters"),
  description: z
    .string({ invalid_type_error: "description must be text" })
    .trim()
    .max(2048, "description must be 2048 characters or less")
    .optional(),
  basePrice: z.coerce
    .number({ invalid_type_error: "basePrice must be numeric" })
    .min(0, "basePrice cannot be negative"),
  duration: z.coerce
    .number({ invalid_type_error: "duration must be numeric" })
    .int("duration must be an integer")
    .min(30, "duration must be at least 30 minutes"),
  active: z.coerce.boolean().optional(),
});

export const updateServiceSchema = createServiceSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

const userRoleSchema = z.enum(["CLIENT", "STAFF", "ADMIN"]);

export const createUserSchema = z.object({
  email: z
    .string({ required_error: "email is required" })
    .email("Provide a valid email"),
  name: z
    .string({ invalid_type_error: "name must be text" })
    .trim()
    .max(128, "name must be 128 characters or less")
    .optional(),
  phone: z
    .string({ invalid_type_error: "phone must be text" })
    .trim()
    .max(32, "phone must be 32 characters or less")
    .optional(),
  role: userRoleSchema.optional(),
  password: z
    .string({ required_error: "password is required" })
    .min(8, "password must be at least 8 characters"),
});

export const updateUserSchema = createUserSchema
  .omit({ email: true, password: true })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

export const updateUserPasswordSchema = z.object({
  password: z
    .string({ required_error: "password is required" })
    .min(8, "password must be at least 8 characters"),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserPasswordInput = z.infer<typeof updateUserPasswordSchema>;
export const createReconciliationNoteSchema = z.object({
  message: z
    .string({ required_error: "message is required" })
    .trim()
    .min(2, "message must be at least 2 characters")
    .max(2000, "message must be 2000 characters or less"),
  status: z.enum(["OPEN", "RESOLVED"]).optional(),
  resolved: z
    .object({
      resolvedById: z.string().min(1),
      resolvedAt: z.string().optional(),
    })
    .optional(),
});
export type CreateReconciliationNoteInput = z.infer<
  typeof createReconciliationNoteSchema
>;
