import { Hono } from "hono";
import app from "../apps/api/dist/index.js";

void Hono;

export const config = {
  runtime: "nodejs",
  maxDuration: 60,
};

export default app;
