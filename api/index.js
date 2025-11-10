// Importación explícita de hono para que Vercel lo identifique como framework soportado
import "hono";
import app from "../apps/api/dist/index.js";

export const config = {
  runtime: "nodejs",
  maxDuration: 60,
};

export default app;
