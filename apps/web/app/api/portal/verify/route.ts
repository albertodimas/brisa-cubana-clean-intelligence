import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const isProduction = process.env.NODE_ENV === "production";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const upstreamResponse = await fetch(`${API_URL}/api/portal/auth/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body ?? {}),
  });

  const text = await upstreamResponse.text();
  const contentType = upstreamResponse.headers.get("content-type");
  const data =
    contentType?.includes("application/json") && text ? JSON.parse(text) : text;

  const nextResponse = NextResponse.json(data, {
    status: upstreamResponse.status,
  });

  if (
    upstreamResponse.ok &&
    data &&
    typeof data === "object" &&
    "data" in data &&
    data.data &&
    typeof data.data === "object"
  ) {
    const portalToken = data.data.portalToken;
    const customerId = data.data.customerId;
    const expiresAtIso = data.data.expiresAt;
    if (typeof portalToken === "string") {
      const expiresAt = expiresAtIso ? new Date(expiresAtIso) : null;
      const maxAge = expiresAt
        ? Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
        : 60 * 60;

      nextResponse.cookies.set({
        name: "portal_token",
        value: portalToken,
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        ...(expiresAt ? { expires: expiresAt } : { maxAge }),
      });

      if (typeof customerId === "string") {
        nextResponse.cookies.set({
          name: "portal_customer_id",
          value: customerId,
          httpOnly: false,
          secure: isProduction,
          sameSite: "lax",
          path: "/",
          ...(expiresAt ? { expires: expiresAt } : { maxAge }),
        });
      }
    }
  } else {
    nextResponse.cookies.delete("portal_token");
    nextResponse.cookies.delete("portal_customer_id");
  }

  return nextResponse;
}
