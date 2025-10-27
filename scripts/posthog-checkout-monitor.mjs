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

const posthogBaseUrl = `${POSTHOG_HOST.replace(/\/$/, "")}/api/projects/${POSTHOG_PROJECT_ID}`;

const queries = [
  {
    event: "checkout_payment_failed",
    label: "Checkout fallido",
    hogql: `SELECT count() FROM events WHERE event = 'checkout_payment_failed' AND timestamp >= now() - INTERVAL ${lookbackMinutes} MINUTE /* ${Date.now()} */`,
    dashboardUrl: "https://us.i.posthog.com/project/225064/dashboard/607007",
  },
  {
    event: "stripe.intent.failed",
    label: "Stripe PaymentIntent fallido",
    hogql: `SELECT count() FROM events WHERE event = 'stripe.intent.failed' AND timestamp >= now() - INTERVAL ${lookbackMinutes} MINUTE /* ${Date.now()} */`,
    dashboardUrl: "https://us.i.posthog.com/project/225064/insight/stripe-intent-failed",
  },
];

async function fetchCount(hogqlQuery) {
  const url = `${posthogBaseUrl}/query/`;
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
  const result = data?.results?.[0]?.[0] ?? 0;
  return Number(result) || 0;
}

async function sendSlackAlert(results) {
  const lines = results
    .map(
      ({ label, event, total, dashboardUrl }) =>
        `• ${label} (\`${event}\`): *${total}* eventos – <${dashboardUrl}|ver detalle>`,
    )
    .join("\n");
  const text = `:rotating_light: *Alertas PostHog en los últimos ${lookbackMinutes} minutos*\n${lines}`;
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
    const results = [];
    for (const query of queries) {
      const total = await fetchCount(query.hogql);
      if (total > 0) {
        results.push({ ...query, total });
      }
    }

    if (results.length === 0) {
      console.log(
        `✅ No se detectaron eventos críticos (checkout o stripe.intent.failed) en los últimos ${lookbackMinutes} minutos.`,
      );
      return;
    }

    await sendSlackAlert(results);
    console.log(
      `🚨 Enviada alerta Slack para ${results
        .map(({ event }) => event)
        .join(", ")}.`,
    );
  } catch (error) {
    console.error("❌ monitor failed:", error);
    process.exit(1);
  }
})();
