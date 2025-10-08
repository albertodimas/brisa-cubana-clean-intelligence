import type { NextRequest } from "next/server";

export const runtime = "nodejs";

let appPromise: Promise<(typeof import("@brisa/api"))["default"]> | null = null;

async function resolveApp() {
  if (!appPromise) {
    appPromise = import("@brisa/api").then((mod) => mod.default);
  }
  return appPromise;
}

async function dispatch(request: NextRequest) {
  const app = await resolveApp();
  return app.fetch(request);
}

export const GET = dispatch;
export const POST = dispatch;
export const PUT = dispatch;
export const PATCH = dispatch;
export const DELETE = dispatch;
export const OPTIONS = dispatch;
