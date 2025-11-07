import { Hono } from "hono";
import { authenticate, requireRoles } from "../middleware/auth.js";
import { parseSearchableQuery } from "../lib/pagination.js";
import { isParseFailure } from "../lib/parse-result.js";
import { handlePrismaError } from "../lib/prisma-error-handler.js";
import { getCustomerRepository } from "../container.js";

const router = new Hono();

router.get(
  "/",
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR"]),
  async (c) => {
    const queryResult = parseSearchableQuery(c);
    if (isParseFailure(queryResult)) {
      return queryResult.response;
    }

    const repository = getCustomerRepository();
    const result = await repository.findManyWithSearch(queryResult.data);
    return c.json(result);
  },
);

router.get(
  "/:id",
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR", "STAFF"]),
  async (c) => {
    const id = c.req.param("id");
    try {
      const repository = getCustomerRepository();
      const customer = await repository.findById(id);
      if (!customer) {
        return c.json({ error: "Customer not found" }, 404);
      }
      return c.json({ data: customer });
    } catch (error) {
      return handlePrismaError(c, error, {
        notFound: "Customer not found",
        default: "Could not retrieve customer",
      });
    }
  },
);

export default router;
