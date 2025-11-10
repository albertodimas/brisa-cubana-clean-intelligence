// Importamos hono explícitamente para que Vercel lo detecte como framework soportado
import "hono";
import app from "../dist/index.js";

export const config = {
  runtime: "nodejs",
  maxDuration: 60,
};

export default app;
