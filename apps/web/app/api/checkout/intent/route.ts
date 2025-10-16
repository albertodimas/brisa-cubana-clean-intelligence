import { NextResponse } from "next/server";
import { auth } from "@/auth";

const API_URL =
  process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";

export async function POST(request: Request) {
  if (!API_URL) {
    return NextResponse.json(
      { error: "API URL no configurada" },
      { status: 500 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida. Envía un cuerpo JSON." },
      { status: 400 },
    );
  }
  const session = await auth();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }

  const response = await fetch(`${API_URL}/api/payments/stripe/intent`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const textBody = await response.text();
  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  const parsed = isJson ? JSON.parse(textBody) : textBody;

  return NextResponse.json(parsed, { status: response.status });
}
