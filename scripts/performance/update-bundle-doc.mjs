#!/usr/bin/env node
/**
 * Actualiza `docs/development/performance/bundle-analysis.md` con datos de
 * `.next/analyze` generados por `pnpm --filter @brisa/web analyze -- --webpack`.
 *
 * Uso:
 *   node scripts/performance/update-bundle-doc.mjs --write   # escribe cambios (defecto)
 *   node scripts/performance/update-bundle-doc.mjs --check   # valida sin escribir
 *
 * Requiere que existan los archivos JSON en `apps/web/.next/analyze/`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(new URL("..", import.meta.url).pathname, "..");
const args = process.argv.slice(2);
const mode = args.includes("--check")
  ? "check"
  : "write";

function runSummary() {
  const result = spawnSync(
    "node",
    ["scripts/performance/generate-bundle-summary.mjs"],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: process.env,
    },
  );

  if (result.status !== 0) {
    throw new Error(
      [
        "Fallo al ejecutar generate-bundle-summary.mjs.",
        "stdout:",
        result.stdout,
        "stderr:",
        result.stderr,
      ].join("\n"),
    );
  }

  return JSON.parse(result.stdout);
}

function formatNumber(value) {
  return Number(value).toFixed(2).replace(/\.00$/, "");
}

function buildSummary(summary) {
  const filesSorted = [...summary.firstLoad.files].sort(
    (a, b) => b.gzipKB - a.gzipKB,
  );
  const topFiles = filesSorted.slice(0, 2);
  const topChunks = topFiles
    .map(
      (file) =>
        `\`${file.file}\` (${formatNumber(file.gzipKB)} kB gzip)`,
    )
    .join(" y ");

  const bullets = [
    `- **First Load JS compartido (gzip): ${formatNumber(summary.firstLoad.totalGzipKB)} kB** (${formatNumber(summary.firstLoad.totalRawKB)} kB sin comprimir) distribuidos en ${summary.firstLoad.files.length} chunks. Los más pesados: ${topChunks}.`,
  ];

  if (summary.sentryChunk) {
    bullets.push(
      `- **Chunk diferido de Sentry:** \`${summary.sentryChunk.file}\` → ${formatNumber(summary.sentryChunk.parsedKB)} kB analizados / ${formatNumber(summary.sentryChunk.gzipKB)} kB gzip. Sigue cargándose tras \`requestIdleCallback\`.`,
    );
  }

  bullets.push(
    `- **Middleware (\`server/middleware.js\`): ${formatNumber(summary.middleware.gzipKB)} kB gzip** (${formatNumber(summary.middleware.rawKB)} kB sin comprimir). El crecimiento proviene de Auth.js 5 beta + rutas híbridas; documentado como foco de optimización.`,
  );

  return bullets.join("\n");
}

function buildRoutes(summary) {
  const header =
    "| Ruta | Chunk | Tamaño gzip | Tamaño raw |\n" +
    "| ---- | ----- | ----------- | ---------- |";

  const rows = summary.routes.map((route) => {
    return `| \`${route.route}\` | \`${route.file}\` | **${formatNumber(route.gzipKB)} kB** | ${formatNumber(route.rawKB)} kB |`;
  });

  return [header, ...rows].join("\n");
}

function replaceBetween(content, startMarker, endMarker, replacement) {
  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(
      `No se encontraron marcadores ${startMarker} ... ${endMarker}`,
    );
  }
  const before =
    content.slice(0, startIndex + startMarker.length) + "\n";
  const after = "\n" + content.slice(endIndex);
  return `${before}${replacement}${after}`;
}

function run(mode) {
  const summary = runSummary();
  const summaryBlock = buildSummary(summary);
  const routesBlock = buildRoutes(summary);

  const docPath = resolve(
    repoRoot,
    "docs/development/performance/bundle-analysis.md",
  );
  const current = readFileSync(docPath, "utf8");

  let next = replaceBetween(
    current,
    "<!-- BUNDLE_SUMMARY:start -->",
    "<!-- BUNDLE_SUMMARY:end -->",
    summaryBlock,
  );
  next = replaceBetween(
    next,
    "<!-- BUNDLE_ROUTES:start -->",
    "<!-- BUNDLE_ROUTES:end -->",
    routesBlock,
  );

  if (mode === "check") {
    if (next !== current) {
      console.error(
        "❌ La documentación de bundle no coincide con los artefactos actuales.\nEjecuta: node scripts/performance/update-bundle-doc.mjs --write",
      );
      process.exit(1);
    }
    console.log("✅ Documentación de bundle sincronizada.");
    return;
  }

  if (next !== current) {
    writeFileSync(docPath, next, "utf8");
    console.log("✅ Bundle analysis document actualizado.");
  } else {
    console.log("✅ Bundle analysis ya estaba sincronizado.");
  }
}

try {
  run(mode);
} catch (error) {
  console.error(`❌ ${error.message}`);
  process.exit(1);
}
