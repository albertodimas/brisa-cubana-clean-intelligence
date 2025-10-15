import { Prisma } from "@prisma/client";

const MODELS_WITH_SOFT_DELETE = new Set([
  "User",
  "Property",
  "Service",
  "Booking",
]);

type WhereInput = Record<string, unknown> | undefined;

function appendNotDeleted(where: WhereInput): Record<string, unknown> {
  if (!where) {
    return { deletedAt: null };
  }

  if (Object.prototype.hasOwnProperty.call(where, "deletedAt")) {
    return where as Record<string, unknown>;
  }

  const scopedWhere = { ...where } as Record<string, unknown> & {
    AND?: unknown;
  };

  const andConditions = Array.isArray(scopedWhere.AND)
    ? [...scopedWhere.AND]
    : scopedWhere.AND
      ? [scopedWhere.AND]
      : [];

  return {
    ...scopedWhere,
    AND: [...andConditions, { deletedAt: null }],
  };
}

export const softDeleteExtension = Prisma.defineExtension({
  name: "softDelete",
  query: {
    $allModels: {
      async findMany({ args, query, model }) {
        if (!MODELS_WITH_SOFT_DELETE.has(model)) {
          return query(args);
        }
        args.where = appendNotDeleted(args.where);
        return query(args);
      },
      async findFirst({ args, query, model }) {
        if (!MODELS_WITH_SOFT_DELETE.has(model)) {
          return query(args);
        }
        args.where = appendNotDeleted(args.where);
        return query(args);
      },
      async findUnique({ args, query, model }) {
        if (!MODELS_WITH_SOFT_DELETE.has(model)) {
          return query(args);
        }
        const record = await query(args);
        if (record && "deletedAt" in record && record.deletedAt !== null) {
          return null;
        }
        return record;
      },
      async count({ args, query, model }) {
        if (!MODELS_WITH_SOFT_DELETE.has(model)) {
          return query(args);
        }
        args.where = appendNotDeleted(args.where);
        return query(args);
      },
      async aggregate({ args, query, model }) {
        if (!MODELS_WITH_SOFT_DELETE.has(model)) {
          return query(args);
        }
        args.where = appendNotDeleted(args.where);
        return query(args);
      },
      async delete(this: unknown, { args, model, query }) {
        if (!MODELS_WITH_SOFT_DELETE.has(model)) {
          return query(args);
        }
        const context = Prisma.getExtensionContext(this) as {
          prisma: Record<string, any>;
        };
        return context.prisma[model].update({
          where: args.where,
          data: { deletedAt: new Date() },
        });
      },
      async deleteMany(this: unknown, { args, model, query }) {
        if (!MODELS_WITH_SOFT_DELETE.has(model)) {
          return query(args);
        }
        const context = Prisma.getExtensionContext(this) as {
          prisma: Record<string, any>;
        };
        return context.prisma[model].updateMany({
          where: args.where,
          data: { deletedAt: new Date() },
        });
      },
    },
  },
});
