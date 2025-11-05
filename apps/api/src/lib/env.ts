import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    DATABASE_URL_UNPOOLED: z.string().min(1).optional(),
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    ALLOWED_ORIGINS: z.string().optional(),
    ENABLE_TEST_UTILS: z.enum(["true", "false"]).optional(),
    HEALTH_CHECK_TOKEN: z.string().optional(),
  })
  .passthrough()
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production" && !data.ALLOWED_ORIGINS) {
      ctx.addIssue({
        path: ["ALLOWED_ORIGINS"],
        code: z.ZodIssueCode.custom,
        message:
          "ALLOWED_ORIGINS must be set in production to avoid falling back to insecure defaults.",
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.flatten();
  const fieldErrors = Object.entries(formatted.fieldErrors)
    .map(([key, errors]) => `${key}: ${errors?.join(", ")}`)
    .join("\n");
  console.error(
    "❌ Invalid environment configuration. Please review the following issues:\n",
    fieldErrors || formatted.formErrors.join("\n"),
  );
  throw new Error("Invalid environment variables");
}

export const env = Object.freeze(parsed.data);

export type Env = typeof env;
