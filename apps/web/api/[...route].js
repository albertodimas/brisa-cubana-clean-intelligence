// @ts-nocheck - Vercel serverless function wrapper
export const runtime = "nodejs";

let cachedApp;

async function resolveApp() {
  if (!cachedApp) {
    const mod = await import("@brisa/api");
    cachedApp = mod.default;
  }
  return cachedApp;
}

const dispatch = async (request) => {
  const app = await resolveApp();
  return app.fetch(request);
};

export const GET = dispatch;
export const POST = dispatch;
export const PUT = dispatch;
export const PATCH = dispatch;
export const DELETE = dispatch;
export const OPTIONS = dispatch;
