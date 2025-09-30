import "server-only";

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
}: PaymentAlertPayload) {
  if (!accessToken) {
    console.warn("[alerts] missing access token, skipping alert");
    return;
  }

  try {
    await fetch(`${API_BASE_URL}/api/alerts/payment`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ failedPayments, pendingPayments }),
    });
  } catch (error) {
    console.error("[alerts] failed to queue alert", error);
  }
}
