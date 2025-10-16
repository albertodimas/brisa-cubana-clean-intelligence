import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/portal/auth/request`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body ?? {}),
    },
  );

  const text = await response.text();
  const contentType = response.headers.get("content-type");
  const data = contentType?.includes("application/json")
    ? JSON.parse(text)
    : text;

  return NextResponse.json(data, { status: response.status });
}
