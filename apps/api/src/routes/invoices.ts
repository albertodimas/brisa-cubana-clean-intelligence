import { Hono } from "hono";
import { z } from "zod";
import type { InvoiceStatus, Prisma } from "@prisma/client";
import { authenticate, requireRoles } from "../middleware/auth.js";
import { handlePrismaError } from "../lib/prisma-error-handler.js";
import { getInvoiceRepository } from "../container.js";
import { createRateLimiter } from "../lib/rate-limiter.js";
import type {
  InvoiceCreateInput,
  InvoiceUpdateInput,
} from "../repositories/invoice-repository.js";

const router = new Hono();

const invoiceMutationRateLimiter = createRateLimiter({
  limit: Number(process.env.INVOICE_CREATE_RATE_LIMIT ?? "20"),
  windowMs: Number(process.env.INVOICE_CREATE_WINDOW_MS ?? "60000"),
  errorMessage:
    "Demasiadas solicitudes de creación de invoices. Intenta nuevamente en unos minutos.",
  identifier: "invoice-create",
});

const invoiceStatusValues = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;

const createInvoiceSchema = z.object({
  bookingId: z.string().cuid(),
  amount: z.coerce.number().positive(),
  status: z.enum(invoiceStatusValues).optional(),
  stripePaymentIntentId: z.string().optional(),
  paidAt: z.coerce.date().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const updateInvoiceSchema = z
  .object({
    amount: z.coerce.number().positive().optional(),
    status: z.enum(invoiceStatusValues).optional(),
    stripePaymentIntentId: z.string().optional(),
    paidAt: z.coerce.date().nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  });

const invoiceQuerySchema = z.object({
  status: z.enum(invoiceStatusValues).optional(),
  bookingId: z.string().cuid().optional(),
  stripePaymentIntentId: z.string().optional(),
});

router.get(
  "/",
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR"]),
  async (c) => {
    const query = c.req.query();
    const parsed = invoiceQuerySchema.safeParse(query);

    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }

    const repository = getInvoiceRepository();
    const invoices = await repository.findManyWithFilters(parsed.data);
    return c.json({ data: invoices });
  },
);

router.get(
  "/:id",
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR"]),
  async (c) => {
    const id = c.req.param("id");
    const repository = getInvoiceRepository();

    try {
      const invoice = await repository.findByIdWithRelations(id);

      if (!invoice) {
        return c.json({ error: "Invoice not found" }, 404);
      }

      return c.json({ data: invoice });
    } catch (error) {
      return handlePrismaError(c, error, {
        notFound: "Invoice not found",
        default: "Could not retrieve invoice",
      });
    }
  },
);

router.post(
  "/",
  invoiceMutationRateLimiter,
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR"]),
  async (c) => {
    const body = await c.req.json();
    const parsed = createInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }

    try {
      const repository = getInvoiceRepository();
      const createData: InvoiceCreateInput = {
        bookingId: parsed.data.bookingId,
        amount: parsed.data.amount,
        status: parsed.data.status,
        stripePaymentIntentId: parsed.data.stripePaymentIntentId,
        paidAt: parsed.data.paidAt,
        metadata: parsed.data.metadata as Prisma.InputJsonValue | undefined,
      };

      const invoice = await repository.create(createData);
      return c.json({ data: invoice }, 201);
    } catch (error) {
      return handlePrismaError(c, error, {
        foreignKey: "La reserva indicada no existe",
        conflict: "Ya existe un invoice con ese stripePaymentIntentId",
        default: "No se pudo crear el invoice",
      });
    }
  },
);

router.patch(
  "/:id",
  invoiceMutationRateLimiter,
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR"]),
  async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const parsed = updateInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }

    try {
      const repository = getInvoiceRepository();
      const updateData: InvoiceUpdateInput = {};

      if (parsed.data.amount !== undefined) {
        updateData.amount = parsed.data.amount;
      }
      if (parsed.data.status !== undefined) {
        updateData.status = parsed.data.status as InvoiceStatus;
      }
      if (parsed.data.stripePaymentIntentId !== undefined) {
        updateData.stripePaymentIntentId = parsed.data.stripePaymentIntentId;
      }
      if (parsed.data.paidAt !== undefined) {
        updateData.paidAt = parsed.data.paidAt ?? undefined;
      }
      if (parsed.data.metadata !== undefined) {
        updateData.metadata = parsed.data.metadata as Prisma.InputJsonValue;
      }

      const invoice = await repository.update(id, updateData);
      return c.json({ data: invoice });
    } catch (error) {
      return handlePrismaError(c, error, {
        notFound: "Invoice no encontrado",
        conflict: "Ya existe un invoice con ese stripePaymentIntentId",
        default: "No se pudo actualizar el invoice",
      });
    }
  },
);

router.delete(
  "/:id",
  invoiceMutationRateLimiter,
  authenticate,
  requireRoles(["ADMIN"]),
  async (c) => {
    const id = c.req.param("id");

    try {
      const repository = getInvoiceRepository();
      await repository.delete(id);
      return c.json({ message: "Invoice deleted successfully" });
    } catch (error) {
      return handlePrismaError(c, error, {
        notFound: "Invoice no encontrado",
        default: "No se pudo eliminar el invoice",
      });
    }
  },
);

export default router;
