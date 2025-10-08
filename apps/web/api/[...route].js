// @ts-nocheck - Vercel serverless function wrapper
import app from "@brisa/api";

export const runtime = "nodejs";

const dispatch = (request) => app.fetch(request);

export const GET = dispatch;
export const POST = dispatch;
export const PUT = dispatch;
export const PATCH = dispatch;
export const DELETE = dispatch;
export const OPTIONS = dispatch;
