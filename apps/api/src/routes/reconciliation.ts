import { Hono } from "hono";
import { db } from "../lib/db";
import { sanitizeNoteMessage } from "../lib/sanitize";
import { getAuthUser, requireAuth } from "../middleware/auth";
import { createReconciliationNoteSchema } from "../schemas";

const notes = new Hono();

notes.use("*", requireAuth(["ADMIN", "STAFF"]));

notes.get("/history/resolved", async (c) => {
  const limit = Number.parseInt(c.req.query("limit") ?? "20", 10);
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const authorEmail = c.req.query("authorEmail");
  const bookingId = c.req.query("bookingId");

  const entries = await db.reconciliationNote.findMany({
    where: {
      status: "RESOLVED",
      resolvedAt: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
      bookingId: bookingId ?? undefined,
      ...(authorEmail
        ? {
            author: {
              email: {
                contains: authorEmail,
                mode: "insensitive",
              },
            },
          }
        : {}),
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      resolvedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { resolvedAt: "desc" },
    take: Number.isNaN(limit) ? 20 : Math.min(limit, 100),
  });

  return c.json(entries);
});

notes.get("/history/open", async (c) => {
  const limit = Number.parseInt(c.req.query("limit") ?? "20", 10);
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const authorEmail = c.req.query("authorEmail");
  const bookingId = c.req.query("bookingId");

  const entries = await db.reconciliationNote.findMany({
    where: {
      status: "OPEN",
      createdAt: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
      bookingId: bookingId ?? undefined,
      ...(authorEmail
        ? {
            author: {
              email: {
                contains: authorEmail,
                mode: "insensitive",
              },
            },
          }
        : {}),
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      resolvedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: Number.isNaN(limit) ? 20 : Math.min(limit, 100),
  });

  return c.json(entries);
});

notes.get("/booking/:bookingId", async (c) => {
  const bookingId = c.req.param("bookingId");
  const statusFilter = c.req.query("status");
  const entries = await db.reconciliationNote.findMany({
    where: {
      bookingId,
      status:
        statusFilter === "OPEN"
          ? "OPEN"
          : statusFilter === "RESOLVED"
            ? "RESOLVED"
            : undefined,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      resolvedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return c.json(entries);
});

notes.post("/booking/:bookingId", async (c) => {
  const bookingId = c.req.param("bookingId");
  const authUser = getAuthUser(c);
  const json = (await c.req.json()) as unknown;
  const parsed = createReconciliationNoteSchema.safeParse(json);

  if (!parsed.success) {
    return c.json(
      {
        error: "Invalid reconciliation note payload",
        details: parsed.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const note = await db.reconciliationNote.create({
    data: {
      bookingId,
      authorId: authUser!.sub,
      message: sanitizeNoteMessage(parsed.data.message),
      status: parsed.data.status ?? "OPEN",
      resolvedById:
        parsed.data.status === "RESOLVED" ? authUser!.sub : undefined,
      resolvedAt: parsed.data.status === "RESOLVED" ? new Date() : undefined,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      resolvedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return c.json(note, 201);
});

notes.patch("/note/:noteId", async (c) => {
  const noteId = c.req.param("noteId");
  const authUser = getAuthUser(c);
  const json = (await c.req.json()) as unknown;
  const parsed = createReconciliationNoteSchema.partial().safeParse(json);

  if (!parsed.success) {
    return c.json(
      {
        error: "Invalid reconciliation note payload",
        details: parsed.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const payload = parsed.data;

  const note = await db.reconciliationNote.update({
    where: { id: noteId },
    data: {
      message: payload.message ? sanitizeNoteMessage(payload.message) : undefined,
      status: payload.status,
      resolvedById:
        payload.status === "RESOLVED"
          ? (payload.resolved?.resolvedById ?? authUser!.sub)
          : payload.status === "OPEN"
            ? null
            : undefined,
      resolvedAt:
        payload.status === "RESOLVED"
          ? payload.resolved?.resolvedAt
            ? new Date(payload.resolved.resolvedAt)
            : new Date()
          : payload.status === "OPEN"
            ? null
            : undefined,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      resolvedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return c.json(note);
});

export default notes;
