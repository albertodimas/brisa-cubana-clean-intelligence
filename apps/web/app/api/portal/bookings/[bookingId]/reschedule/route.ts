import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  extractSessionToken,
  validateSessionToken,
} from "@/lib/auth/session-token";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function POST(
  request: Request,
  context: { params: Promise<{ bookingId: string }> },
) {
  const cookieStore = await cookies();
  const sessionToken = extractSessionToken(cookieStore);
  if (!sessionToken || !(await validateSessionToken(sessionToken))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { bookingId } = await context.params;
  const body = await request.text();

  const upstreamResponse = await fetch(
    `${API_URL}/api/portal/bookings/${bookingId}/reschedule`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
        authorization: request.headers.get("authorization") ?? "",
      },
      body,
      credentials: "include",
    },
  );

  const contentType = upstreamResponse.headers.get("content-type");
  const payload =
    contentType?.includes("application/json") && upstreamResponse.status !== 204
      ? await upstreamResponse.json()
      : await upstreamResponse.text();

  const response = NextResponse.json(payload, {
    status: upstreamResponse.status,
  });

  const candidate = upstreamResponse.headers as unknown as {
    getSetCookie?: () => string[];
  };
  const setCookieHeaders =
    typeof candidate.getSetCookie === "function"
      ? (candidate.getSetCookie() ?? [])
      : [];

  setCookieHeaders.forEach((cookie) => {
    response.headers.append("set-cookie", cookie);
  });

  return response;
}
