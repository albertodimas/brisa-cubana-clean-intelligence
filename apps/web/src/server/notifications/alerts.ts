import "server-only";
import { isFakeDataEnabled } from "@/server/utils/fake";
import { env } from "@/config/env";
import { logger } from "@/server/logger";

const API_BASE_URL = env.apiUrl;

interface PaymentAlertPayload {
  failedPayments: number;
  pendingPayments: number;
}

export async function queuePaymentAlert({
  failedPayments,
  pendingPayments,
}: PaymentAlertPayload): Promise<boolean> {
  if (isFakeDataEnabled()) {
    return true;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/alerts/payment`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include", // Forward cookies (brisa_access, brisa_refresh)
      body: JSON.stringify({ failedPayments, pendingPayments }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "<no-body>");
      logger.warn(
        {
          status: response.status,
          body: text,
          failedPayments,
          pendingPayments,
        },
        "[alerts] failed to queue alert: non-OK response",
      );
      return false;
    }

    return true;
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : "unknown",
        failedPayments,
        pendingPayments,
      },
      "[alerts] failed to queue alert",
    );
    return false;
  }
}
