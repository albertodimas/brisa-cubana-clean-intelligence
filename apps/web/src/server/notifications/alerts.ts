import "server-only";
import { isFakeDataEnabled } from "@/server/utils/fake";

const API_BASE_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001";

interface PaymentAlertPayload {
  failedPayments: number;
  pendingPayments: number;
  accessToken?: string | null;
}

export async function queuePaymentAlert({
  failedPayments,
  pendingPayments,
  accessToken,
}: PaymentAlertPayload): Promise<boolean> {
  if (isFakeDataEnabled()) {
    return true;
  }

  if (!accessToken) {
    console.warn("[alerts] missing access token, skipping alert");
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/alerts/payment`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
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
