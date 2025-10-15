import { Hono } from "hono";
import { authenticate, requireRoles } from "../middleware/auth.js";
import { parseSearchableQuery } from "../lib/pagination.js";
import { getCustomerRepository } from "../container.js";

const router = new Hono();

router.get(
  "/",
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR"]),
  async (c) => {
    const queryResult = parseSearchableQuery(c);
    if (!queryResult.success) {
      return queryResult.response;
    }

    const repository = getCustomerRepository();
    const result = await repository.findManyWithSearch(queryResult.data);
    return c.json(result);
  },
);

export default router;
