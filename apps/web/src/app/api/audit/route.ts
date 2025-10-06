import { NextResponse } from "next/server";
import { auth } from "@/server/auth/config";
import { getAuditTrail } from "@/server/api/audit";

export async function GET(request: Request) {
  const session = await auth();

  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "STAFF")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") ?? undefined;
    const endDate = searchParams.get("endDate") ?? undefined;
    const limit = searchParams.get("limit");
    const authorEmail = searchParams.get("authorEmail") ?? undefined;
    const bookingId = searchParams.get("bookingId") ?? undefined;
    const minFailed = searchParams.get("minFailed");
    const minPending = searchParams.get("minPending");

    const audit = await getAuditTrail({
      startDate,
      endDate,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
      authorEmail,
      bookingId,
      minFailed: minFailed ? Number.parseInt(minFailed, 10) : undefined,
      minPending: minPending ? Number.parseInt(minPending, 10) : undefined,
    });
    return NextResponse.json(audit);
  } catch (error) {
    console.error("Failed to load audit trail", error);
    return NextResponse.json(
      { error: "Unable to load audit trail" },
      { status: 500 },
    );
  }
}
