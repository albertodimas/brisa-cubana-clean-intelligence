// Importación explícita de hono para que Vercel detecte correctamente el framework
import "hono";
import app from "./apps/api/dist/index.js";

export default app;
