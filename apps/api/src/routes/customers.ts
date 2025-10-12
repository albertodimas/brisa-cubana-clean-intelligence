import { Hono } from "hono";
import { authenticate, requireRoles } from "../middleware/auth.js";
import { parsePaginationQuery } from "../lib/pagination.js";
import { getCustomerRepository } from "../container.js";

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

    const repository = getCustomerRepository();
    const result = await repository.findMany(paginationResult.data);
    return c.json(result);
  },
);

export default router;
