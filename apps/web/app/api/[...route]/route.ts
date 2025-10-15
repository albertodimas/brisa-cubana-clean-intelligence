import type { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { auth } from "@/auth";

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

  responseHeaders.set(
    "Access-Control-Allow-Origin",
    request.headers.get("origin") ?? "*",
  );
  responseHeaders.delete("content-length");
  responseHeaders.delete("content-encoding");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
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
