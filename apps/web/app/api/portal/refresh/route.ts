import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function POST(request: Request) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    headers.cookie = cookieHeader;
  }

  const upstreamResponse = await fetch(`${API_URL}/api/portal/auth/refresh`, {
    method: "POST",
    headers,
    credentials: "include",
  });

  const text = await upstreamResponse.text();
  const contentType = upstreamResponse.headers.get("content-type");
  const data =
    contentType?.includes("application/json") && text ? JSON.parse(text) : text;

  const response = NextResponse.json(data, {
    status: upstreamResponse.status,
  });

  const candidate = upstreamResponse.headers as unknown as {
    getSetCookie?: () => string[];
  };
  const setCookieHeaders =
    typeof candidate.getSetCookie === "function"
      ? (candidate.getSetCookie() ?? [])
      : [];

  if (setCookieHeaders.length > 0) {
    setCookieHeaders.forEach((cookie) => {
      response.headers.append("set-cookie", cookie);
    });
  } else if (!upstreamResponse.ok) {
    response.cookies.delete("portal_token");
    response.cookies.delete("portal_refresh_token");
    response.cookies.delete("portal_customer_id");
  }

  return response;
}
