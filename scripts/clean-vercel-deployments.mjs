#!/usr/bin/env node

/**
 * Utility to prune Vercel deployments, keeping only the deployments explicitly
 * listed as CLI arguments.
 *
 * Usage:
 *   VERCEL_TOKEN=xxx VERCEL_ORG_ID=team_123 VERCEL_PROJECT_ID=prj_abc \
 *     node scripts/clean-vercel-deployments.mjs \
 *     keep-url-1.vercel.app keep-url-2.vercel.app
 *
 * Optional env vars:
 *   FETCH_LIMIT   → number of deployments requested per API page (default 100)
 *   MAX_DELETE    → maximum deletions per execution (default 200, Vercel limit)
 */

import process from "node:process";

const {
  VERCEL_TOKEN,
  VERCEL_ORG_ID,
  VERCEL_PROJECT_ID,
  FETCH_LIMIT = "100",
  MAX_DELETE = "200",
} = process.env;

if (!VERCEL_TOKEN) {
  console.error("❌ VERCEL_TOKEN is required.");
  process.exit(1);
}
if (!VERCEL_ORG_ID) {
  console.error("❌ VERCEL_ORG_ID is required.");
  process.exit(1);
}

const keepList = new Set(process.argv.slice(2));
const deletionsCap = Number.parseInt(MAX_DELETE, 10);
const fetchLimit = Number.parseInt(FETCH_LIMIT, 10);
if (Number.isNaN(deletionsCap) || deletionsCap <= 0) {
  console.error("❌ MAX_DELETE must be a positive integer.");
  process.exit(1);
}
if (Number.isNaN(fetchLimit) || fetchLimit <= 0) {
  console.error("❌ FETCH_LIMIT must be a positive integer.");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${VERCEL_TOKEN}`,
};

function buildListUrl(cursor) {
  const url = new URL("https://api.vercel.com/v6/deployments");
  url.searchParams.set("teamId", VERCEL_ORG_ID);
  url.searchParams.set("limit", String(fetchLimit));
  if (VERCEL_PROJECT_ID) {
    url.searchParams.set("projectId", VERCEL_PROJECT_ID);
  }
  if (cursor) {
    url.searchParams.set("until", cursor);
  }
  return url;
}

async function listDeployments(cursor) {
  const res = await fetch(buildListUrl(cursor), { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`List deployments failed: ${res.status} ${body}`);
  }
  return res.json();
}

async function deleteDeployment(uid, url) {
  const res = await fetch(
    `https://api.vercel.com/v13/deployments/${uid}?teamId=${VERCEL_ORG_ID}`,
    {
      method: "DELETE",
      headers,
    },
  );
  const body = await res.text();
  if (!res.ok) {
    throw new Error(
      `Deletion failed for ${url}: ${res.status} ${res.statusText}\n${body}`,
    );
  }
  console.log(`🧹 Removed ${url} (${uid})`);
}

async function main() {
  let deleted = 0;
  let cursor;

  while (true) {
    const { deployments = [], pagination } = await listDeployments(cursor);
    if (deployments.length === 0) {
      break;
    }

    for (const deployment of deployments) {
      if (deleted >= deletionsCap) {
        console.warn(`⚠️ Reached deletions cap (${deletionsCap}).`);
        return;
      }

      const { uid, url } = deployment;
      if (keepList.has(url)) {
        continue;
      }

      try {
        await deleteDeployment(uid, url);
        deleted += 1;
      } catch (error) {
        console.error(`❌ ${error.message}`);
        if (error.message.includes("429")) {
          console.error("Hit rate limit. Try again after cooldown.");
          return;
        }
      }
    }

    if (!pagination || !pagination.next) {
      break;
    }
    cursor = pagination.next;
  }

  console.log(`✅ Deleted ${deleted} deployments.`);
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});

