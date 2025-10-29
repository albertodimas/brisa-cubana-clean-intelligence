#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_THRESHOLD_DAYS = Number.parseInt(
  process.env.MARKET_STATS_THRESHOLD_DAYS ?? "120",
  10,
);

async function main() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Parámetro incompleto para ${key}`);
    }
    if (key === "--json") {
      options.jsonPath = path.resolve(value);
    } else if (key === "--markdown") {
      options.markdownPath = path.resolve(value);
    } else if (key === "--threshold") {
      options.thresholdDays = Number.parseInt(value, 10);
    } else {
      throw new Error(`Parámetro no soportado: ${key}`);
    }
  }

  const thresholdDays =
    Number.isFinite(options.thresholdDays) && options.thresholdDays > 0
      ? options.thresholdDays
      : DEFAULT_THRESHOLD_DAYS;

  const dataPath = path.resolve(
    __dirname,
    "../apps/web/data/marketStats.json",
  );
  const raw = await fs.readFile(dataPath, "utf8");
  const stats = JSON.parse(raw);

  const now = new Date();
  const staleMetrics = [];
  const healthyMetrics = [];

  for (const stat of stats) {
    const lastUpdated = new Date(stat.lastUpdated);
    const diffDays = Number.isNaN(lastUpdated.getTime())
      ? Number.POSITIVE_INFINITY
      : Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));

    const enriched = {
      metricId: stat.metricId,
      label: stat.label,
      lastUpdated: stat.lastUpdated ?? "desconocido",
      daysSinceUpdate: Number.isFinite(diffDays) ? diffDays : null,
      source: stat.source,
      sourceUrl: stat.sourceUrl,
    };

    if (!Number.isFinite(diffDays) || diffDays > thresholdDays) {
      staleMetrics.push(enriched);
    } else {
      healthyMetrics.push(enriched);
    }
  }

  const summary = {
    generatedAt: now.toISOString(),
    thresholdDays,
    staleMetrics,
    healthyMetrics,
  };

  if (options.jsonPath) {
    await fs.mkdir(path.dirname(options.jsonPath), { recursive: true });
    await fs.writeFile(options.jsonPath, JSON.stringify(summary, null, 2), "utf8");
  }

  if (options.markdownPath) {
    const lines = [
      `# Métricas de mercado desactualizadas (${now.toISOString().slice(0, 10)})`,
      "",
    ];

    if (staleMetrics.length === 0) {
      lines.push(
        "Todas las métricas en `apps/web/data/marketStats.json` se encuentran dentro del umbral configurado.",
      );
    } else {
      lines.push(
        `Se detectaron ${staleMetrics.length} métricas que superan el umbral de ${thresholdDays} días desde su última actualización:`,
        "",
      );
      for (const metric of staleMetrics) {
        lines.push(
          `- **${metric.metricId}** (${metric.label}) · última actualización: ${metric.lastUpdated} · ${metric.daysSinceUpdate ?? "??"} días · fuente: ${metric.source}`,
        );
      }
      lines.push(
        "",
        "Actualiza los valores en `apps/web/data/marketStats.json`, cita la fuente en `source`/`sourceUrl` y ejecuta `pnpm --filter @brisa/web test` para validar.",
      );
    }

    await fs.mkdir(path.dirname(options.markdownPath), { recursive: true });
    await fs.writeFile(options.markdownPath, lines.join("\n"), "utf8");
  }

  if (process.env.GITHUB_OUTPUT) {
    await fs.appendFile(
      process.env.GITHUB_OUTPUT,
      `stale_count=${staleMetrics.length}\n`,
    );
    if (options.markdownPath) {
      await fs.appendFile(
        process.env.GITHUB_OUTPUT,
        `report_markdown=${options.markdownPath}\n`,
      );
    }
    if (options.jsonPath) {
      await fs.appendFile(
        process.env.GITHUB_OUTPUT,
        `report_json=${options.jsonPath}\n`,
      );
    }
  }

  if (staleMetrics.length > 0) {
    console.warn(
      `Se detectaron ${staleMetrics.length} métricas fuera de fecha (>${thresholdDays} días).`,
    );
  } else {
    console.log("Todas las métricas están dentro del umbral configurado.");
  }
}

main().catch((error) => {
  console.error("[market-stats-watchdog] error:", error);
  process.exitCode = 1;
});
