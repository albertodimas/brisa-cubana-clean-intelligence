#!/usr/bin/env node

/**
 * Crea o actualiza un panel en PostHog con las métricas que usa el workflow
 * `posthog-monitor.yml`. El panel se añade automáticamente al dashboard
 * indicado mediante `POSTHOG_DASHBOARD_ID`.
 *
 * Requisitos (variables de entorno):
 *   - POSTHOG_API_KEY: clave personal con permisos de edición.
 *   - POSTHOG_HOST: URL base (default: https://us.i.posthog.com).
 *   - POSTHOG_PROJECT_ID: ID numérico del proyecto (default: 225064).
 *   - POSTHOG_DASHBOARD_ID: ID del dashboard que recibirá el panel
 *     (default: 607007).
 *   - POSTHOG_TILE_NAME: Nombre del panel (default: "Checkout failures (CI monitor)").
 */

import process from "node:process";

const {
  POSTHOG_API_KEY,
  POSTHOG_HOST = "https://us.i.posthog.com",
  POSTHOG_PROJECT_ID = "225064",
  POSTHOG_DASHBOARD_ID = "607007",
  POSTHOG_TILE_NAME = "Checkout failures (CI monitor)",
  POSTHOG_INCLUDE_STRIPE_INTENT = "true",
} = process.env;

if (!POSTHOG_API_KEY) {
  console.error("❌ Falta la variable POSTHOG_API_KEY (personal API key).");
  process.exit(1);
}

const baseHost = POSTHOG_HOST.replace(/\/$/, "");
const projectId = encodeURIComponent(POSTHOG_PROJECT_ID);
const dashboardId = encodeURIComponent(POSTHOG_DASHBOARD_ID);

const headers = {
  Authorization: `Bearer ${POSTHOG_API_KEY}`,
  "Content-Type": "application/json",
};

const checkoutHogql = `SELECT
  toStartOfInterval(timestamp, INTERVAL 1 HOUR) AS hour,
  count() AS checkout_failures
FROM events
WHERE event = 'checkout_payment_failed'
  AND timestamp >= now() - INTERVAL 7 DAY
GROUP BY hour
ORDER BY hour ASC`;

const stripeIntentHogql = `SELECT
  toStartOfInterval(timestamp, INTERVAL 1 HOUR) AS hour,
  count() AS stripe_failures
FROM events
WHERE event = 'stripe.intent.failed'
  AND timestamp >= now() - INTERVAL 7 DAY
GROUP BY hour
ORDER BY hour ASC`;

const insightConfigs = [
  {
    name: POSTHOG_TILE_NAME,
    description:
      "Panorama de checkout_payment_failed consumido por posthog-monitor.yml",
    query: checkoutHogql,
    insight: "TRENDS",
    display: "ActionsLineGraph",
  },
];

if (POSTHOG_INCLUDE_STRIPE_INTENT !== "false") {
  insightConfigs.push({
    name: "Stripe intents (CI monitor)",
    description:
      "Eventos stripe.intent.failed para monitorear errores de PaymentIntent",
    query: stripeIntentHogql,
    insight: "TRENDS",
    display: "ActionsLineGraph",
  });
}

async function fetchDashboardWithTiles() {
  const url = `${baseHost}/api/projects/${projectId}/dashboards/${dashboardId}/?include_tiles=true`;
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `No fue posible obtener el dashboard ${POSTHOG_DASHBOARD_ID}: ${response.status} ${response.statusText}\n${text}`,
    );
  }

  return response.json();
}

async function createInsight(config) {
  const payload = {
    name: config.name,
    description: config.description,
    dash_mode: "last",
    query: {
      kind: "HogQLQuery",
      query: config.query,
    },
    filters: {
      insight: config.insight,
      display: config.display,
    },
    dashboards: [POSTHOG_DASHBOARD_ID],
  };

  const url = `${baseHost}/api/projects/${projectId}/insights/`;
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Error creando insight: ${response.status} ${response.statusText}\n${text}`,
    );
  }

  const data = await response.json();
  return data;
}

async function updateInsight(insightId, config) {
  const payload = {
    name: config.name,
    query: {
      kind: "HogQLQuery",
      query: config.query,
    },
    filters: {
      insight: config.insight,
      display: config.display,
    },
  };

  const url = `${baseHost}/api/projects/${projectId}/insights/${insightId}/`;
  const response = await fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Error actualizando insight ${insightId}: ${response.status} ${response.statusText}\n${text}`,
    );
  }

  return response.json();
}

try {
  const dashboard = await fetchDashboardWithTiles();
  const tiles = dashboard.tiles ?? [];

  for (const config of insightConfigs) {
    const existingTile = tiles.find(
      (tile) => tile?.insight?.name === config.name,
    );

    if (existingTile?.insight?.id) {
      await updateInsight(existingTile.insight.id, config);
      console.log(
        `✅ Insight "${config.name}" actualizado (ID ${existingTile.insight.id}) en el dashboard ${POSTHOG_DASHBOARD_ID}.`,
      );
    } else {
      const insight = await createInsight(config);
      console.log(
        `✅ Insight "${config.name}" creado (ID ${insight.id}) y añadido al dashboard ${POSTHOG_DASHBOARD_ID}.`,
      );
    }
  }
} catch (error) {
  console.error("❌ No se pudo sincronizar el panel de PostHog:", error);
  process.exit(1);
}
