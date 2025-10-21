#!/usr/bin/env node
import process from "node:process";

const {
  POSTHOG_API_KEY,
  POSTHOG_HOST = "https://us.i.posthog.com",
  POSTHOG_PROJECT_ID = "225064",
  SLACK_WEBHOOK_URL,
  POSTHOG_CHECKOUT_LOOKBACK_MINUTES = "5",
} = process.env;

if (!POSTHOG_API_KEY) {
  console.error("❌ Missing POSTHOG_API_KEY environment variable.");
  process.exit(1);
}

if (!SLACK_WEBHOOK_URL) {
  console.error("❌ Missing SLACK_WEBHOOK_URL environment variable.");
  process.exit(1);
}

const lookbackMinutes = Number.parseInt(POSTHOG_CHECKOUT_LOOKBACK_MINUTES, 10);
if (Number.isNaN(lookbackMinutes) || lookbackMinutes <= 0) {
  console.error(
    "❌ POSTHOG_CHECKOUT_LOOKBACK_MINUTES must be a positive integer (minutes).",
  );
  process.exit(1);
}

const hogqlQuery = `SELECT count() AS total FROM events WHERE event = 'checkout_payment_failed' AND timestamp >= now() - INTERVAL ${lookbackMinutes} MINUTE /* ${Date.now()} */`;

async function fetchCheckoutFailures() {
  const url = `${POSTHOG_HOST.replace(/\/$/, "")}/api/projects/${POSTHOG_PROJECT_ID}/query/`;
 const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${POSTHOG_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: {
        kind: "HogQLQuery",
        query: hogqlQuery,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `PostHog query failed with status ${response.status}: ${response.statusText}\n${text}`,
    );
  }

  const data = await response.json();
  const results = data?.results?.[0]?.[0] ?? 0;
  return Number(results) || 0;
}

async function sendSlackAlert(total) {
  const text = `:rotating_light: *Checkout fallido detectado*\nEventos \`checkout_payment_failed\`: *${total}* en los últimos ${lookbackMinutes} minutos.\nVer dashboard: https://us.i.posthog.com/project/225064/dashboard/607007`;

  const response = await fetch(SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const textBody = await response.text();
    throw new Error(
      `Slack webhook failed with status ${response.status}: ${response.statusText}\n${textBody}`,
    );
  }
}

(async () => {
  try {
    const total = await fetchCheckoutFailures();

    if (total > 0) {
      await sendSlackAlert(total);
      console.log(
        `🚨 Sent Slack alert: ${total} checkout_payment_failed in last ${lookbackMinutes} minutes.`,
      );
    } else {
      console.log(
        `✅ No checkout_payment_failed events in last ${lookbackMinutes} minutes.`,
      );
    }
  } catch (error) {
    console.error("❌ monitor failed:", error);
    process.exit(1);
  }
})();
