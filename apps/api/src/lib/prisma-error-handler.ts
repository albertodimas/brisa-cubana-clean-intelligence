import { Prisma } from "@prisma/client";
import type { Context } from "hono";

type PrismaErrorMessages = {
  conflict?: string;
  notFound?: string;
  foreignKey?: string;
  validation?: string;
  default?: string;
};

export function handlePrismaError(
  c: Context,
  error: unknown,
  messages: PrismaErrorMessages = {},
): Response {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return c.json({ error: messages.conflict ?? "Recurso ya existe" }, 409);
      case "P2025":
        return c.json(
          { error: messages.notFound ?? "Recurso no encontrado" },
          404,
        );
      case "P2003":
        return c.json(
          { error: messages.foreignKey ?? "Relación inválida" },
          400,
        );
      default:
        break;
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return c.json({ error: messages.validation ?? "Datos inválidos" }, 400);
  }

  console.error("[prisma] unexpected error", error);
  return c.json({ error: messages.default ?? "Error interno inesperado" }, 500);
}
