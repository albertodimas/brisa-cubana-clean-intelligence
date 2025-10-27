import type { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { auth } from "@/auth";

const proxyAllowedOrigins = (process.env.PROXY_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function resolveApiBaseUrl(): string {
  const value = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!value) {
    throw new Error(
      "API_BASE_URL is not defined. Set INTERNAL_API_URL or NEXT_PUBLIC_API_URL.",
    );
  }
  return value.endsWith("/") ? value : `${value}/`;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildTargetUrl(request: NextRequest, segments: string[]) {
  const path = segments.length > 0 ? `api/${segments.join("/")}` : "api";
  const upstreamUrl = new URL(path, resolveApiBaseUrl());
  const currentUrl = new URL(request.url);
  upstreamUrl.search = currentUrl.search;
  return upstreamUrl;
}

function resolveAllowedOrigin(request: NextRequest): string | null {
  const headerOrigin = request.headers.get("origin");
  if (!headerOrigin) {
    return null;
  }

  if (proxyAllowedOrigins.length > 0) {
    return proxyAllowedOrigins.includes(headerOrigin) ? headerOrigin : null;
  }

  const requestOrigin = request.nextUrl.origin;
  return headerOrigin === requestOrigin ? headerOrigin : null;
}

async function proxy(
  request: NextRequest,
  { params }: { params: Promise<{ route: string[] }> },
) {
  const resolvedParams = await params;
  const segments: string[] = resolvedParams?.route ?? [];
  const url = buildTargetUrl(request, segments);
  const headers = new Headers(request.headers);
  headers.delete("host");

  if (!headers.has("authorization")) {
    const session = await auth();
    const token = session?.accessToken;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
  }

  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    if (request.body) {
      init.body = request.body;
      init.duplex = "half";
    } else {
      const clone = request.clone();
      const body = await clone.arrayBuffer();
      init.body = body;
      init.duplex = "half";
    }
  }

  logger.info("api proxy request.forward", {
    method: request.method,
    url: url.toString(),
  });
  let upstream: Response;

  try {
    upstream = await fetch(url, init);
  } catch (error) {
    logger.error("api proxy request.error", {
      method: request.method,
      url: url.toString(),
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error,
    });
    return new Response(
      JSON.stringify({ error: "Upstream service unavailable" }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
  logger.info("api proxy request.complete", {
    method: request.method,
    url: url.toString(),
    status: upstream.status,
    statusText: upstream.statusText,
  });
  const responseHeaders = new Headers(upstream.headers);

  const allowedOrigin = resolveAllowedOrigin(request);
  if (allowedOrigin) {
    responseHeaders.set("Access-Control-Allow-Origin", allowedOrigin);
  } else {
    responseHeaders.delete("Access-Control-Allow-Origin");
    responseHeaders.delete("Access-Control-Allow-Credentials");
  }
  responseHeaders.delete("content-length");
  responseHeaders.delete("content-encoding");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export function OPTIONS(request: NextRequest) {
  const allowedOrigin = resolveAllowedOrigin(request);
  const defaultOrigin = process.env.NEXT_PUBLIC_BASE_URL ?? null;
  return new Response(null, {
    status: 204,
    headers: {
      ...(allowedOrigin
        ? { "Access-Control-Allow-Origin": allowedOrigin }
        : defaultOrigin
          ? { "Access-Control-Allow-Origin": defaultOrigin }
          : {}),
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
