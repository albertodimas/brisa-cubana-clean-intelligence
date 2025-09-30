import { NextResponse } from "next/server";
import { auth } from "@/server/auth/config";
import { getAuditTrail } from "@/server/api/audit";

function toCsv(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value).replace(/"/g, '""');
  return str.includes(",") ? `"${str}"` : str;
}

export async function GET(request: Request) {
  const session = await auth();

  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "STAFF")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
  const authorEmail = searchParams.get("authorEmail") ?? undefined;
  const bookingId = searchParams.get("bookingId") ?? undefined;
  const minFailedParam = searchParams.get("minFailed");
  const minPendingParam = searchParams.get("minPending");

  const audit = await getAuditTrail(session.user.accessToken ?? "", {
    startDate,
    endDate,
    limit,
    authorEmail,
    bookingId,
    minFailed: minFailedParam ? Number.parseInt(minFailedParam, 10) : undefined,
    minPending: minPendingParam
      ? Number.parseInt(minPendingParam, 10)
      : undefined,
  });

  const rows: string[] = [];
  rows.push(
    "type,createdAt,failedPayments,pendingPayments,message,author,resolvedBy,resolvedAt",
  );

  for (const alert of audit.alerts) {
    rows.push(
      [
        "alert",
        alert.triggeredAt,
        alert.failedPayments,
        alert.pendingPayments,
        "",
        "",
        "",
        "",
      ]
        .map(toCsv)
        .join(","),
    );
  }

  for (const note of [...audit.notesResolved, ...audit.notesOpen]) {
    rows.push(
      [
        note.resolvedAt ? "note_resolved" : "note_open",
        note.createdAt,
        "",
        "",
        note.message,
        note.author?.email ?? note.author?.name ?? "",
        note.resolvedBy?.email ?? note.resolvedBy?.name ?? "",
        note.resolvedAt ?? "",
      ]
        .map(toCsv)
        .join(","),
    );
  }

  const csv = rows.join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="audit-trail.csv"',
    },
  });
}
