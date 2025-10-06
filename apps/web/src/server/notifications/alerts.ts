import "server-only";
import { isFakeDataEnabled } from "@/server/utils/fake";

const API_BASE_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001";

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
      console.error("[alerts] failed to queue alert", {
        status: response.status,
        body: text,
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("[alerts] failed to queue alert", error);
    return false;
  }
}
