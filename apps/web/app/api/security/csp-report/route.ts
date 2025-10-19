import * as Sentry from "@sentry/nextjs";
import { NextResponse, type NextRequest } from "next/server";

type CspReport = {
  "csp-report"?: Record<string, unknown>;
  [key: string]: unknown;
};

const normalizeReport = (payload: CspReport) => {
  if (payload["csp-report"]) {
    return payload["csp-report"];
  }

  return payload;
};

export const POST = async (request: NextRequest) => {
  try {
    const report = (await request.json()) as CspReport;
    const normalized = normalizeReport(report);

    Sentry.captureMessage("CSP Violation", {
      level: "warning",
      extra: {
        "csp-report": normalized,
        userAgent: request.headers.get("user-agent") ?? "unknown",
        referer: request.headers.get("referer") ?? "unknown",
      },
    });
  } catch (error) {
    Sentry.captureException(error, {
      level: "error",
      tags: { source: "csp-report" },
    });
  }

  return NextResponse.json({ received: true });
};

export const GET = () =>
  new NextResponse("Use POST with a JSON CSP report payload", { status: 405 });
