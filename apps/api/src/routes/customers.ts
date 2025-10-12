import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";
import { authenticate, requireRoles } from "../middleware/auth.js";
import {
  parsePaginationQuery,
  buildPaginatedResponse,
} from "../lib/pagination.js";

const router = new Hono();

router.get(
  "/",
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR"]),
  async (c) => {
    const paginationResult = parsePaginationQuery(c);
    if (!paginationResult.success) {
      return paginationResult.response;
    }

    const { limit, cursor } = paginationResult.data;

    const customers = await prisma.user.findMany({
      where: { role: "CLIENT" },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    return c.json(buildPaginatedResponse(customers, limit, cursor));
  },
);

export default router;
