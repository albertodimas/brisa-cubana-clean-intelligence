import type { NextRequest } from "next/server";

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

function buildTargetUrl(segments: string[]) {
  return new URL(segments.join("/"), resolveApiBaseUrl());
}

async function proxy(request: NextRequest, context: any) {
  const segments: string[] = context?.params?.route ?? [];
  const url = buildTargetUrl(segments);
  const headers = new Headers(request.headers);
  headers.delete("host");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
  }

  const upstream = await fetch(url, init);
  const responseHeaders = new Headers(upstream.headers);

  responseHeaders.set(
    "Access-Control-Allow-Origin",
    request.headers.get("origin") ?? "*",
  );
  responseHeaders.delete("content-length");

  const bodyText = await upstream.text();

  return new Response(bodyText, {
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
