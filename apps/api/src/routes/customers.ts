import { Hono } from "hono";
import { prisma } from "../lib/prisma.js";
import { authenticate, requireRoles } from "../middleware/auth.js";

const router = new Hono();

router.get(
  "/",
  authenticate,
  requireRoles(["ADMIN", "COORDINATOR"]),
  async (c) => {
    const customers = await prisma.user.findMany({
      where: { role: "CLIENT" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });
    return c.json({ data: customers });
  },
);

export default router;
