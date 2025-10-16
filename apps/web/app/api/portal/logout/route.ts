import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const isProduction = process.env.NODE_ENV === "production";

export async function POST() {
  const upstreamResponse = await fetch(`${API_URL}/api/portal/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
  } else {
    response.cookies.delete("portal_token");
    response.cookies.delete("portal_customer_id");
  }

  if (upstreamResponse.ok) {
    response.cookies.set({
      name: "portal_logout_ts",
      value: String(Date.now()),
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 5,
      path: "/",
    });
  }

  return response;
}
