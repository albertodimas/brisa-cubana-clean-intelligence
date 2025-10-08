import { handle } from "hono/vercel";
import app from "../src/app.js";

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const OPTIONS = handle(app);
