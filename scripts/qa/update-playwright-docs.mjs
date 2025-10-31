#!/usr/bin/env node
/**
 * Sincroniza los conteos de suites Playwright con la documentación marcada.
 * Usa `pnpm exec playwright test --list` para obtener la lista de pruebas por proyecto.
 *
 * Uso:
 *   node scripts/qa/update-playwright-docs.mjs --write   # actualiza archivos
 *   node scripts/qa/update-playwright-docs.mjs --check   # valida sin escribir (exit 1 si hay difs)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const repoRoot = resolve(new URL("..", import.meta.url).pathname, "..");
const configPath = resolve(repoRoot, "config/playwright-suites.json");
const suitesConfig = JSON.parse(readFileSync(configPath, "utf8"));

const args = process.argv.slice(2);
const mode = args.includes("--write")
  ? "write"
  : args.includes("--check")
    ? "check"
    : "write";

function runPlaywrightList() {
  const result = spawnSync(
    "pnpm",
    ["exec", "playwright", "test", "--list"],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: process.env,
    },
  );

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      `playwright --list terminó con código ${result.status}:\n${result.stdout}\n${result.stderr}`,
    );
  }

  return result.stdout;
}

function parseCounts(output) {
  const counts = new Map();
  const projectLine = /^\s*\[(?<project>[^\]]+)] ›/;
  let grandTotal = null;

  for (const line of output.split("\n")) {
    const match = projectLine.exec(line);
    if (match) {
      const key = match.groups.project.trim();
      counts.set(key, (counts.get(key) ?? 0) + 1);
      continue;
    }

    const totalMatch = /Total:\s+(\d+)\s+tests/i.exec(line);
    if (totalMatch) {
      grandTotal = Number(totalMatch[1]);
    }
  }

  return { counts, grandTotal };
}

function buildTable(counts) {
  const labels = suitesConfig.map((suite) => suite.label);
  const countsStrings = suitesConfig.map(
    (suite) => String(counts.get(suite.project) ?? 0),
  );
  const durations = suitesConfig.map((suite) => suite.duration);
  const commands = suitesConfig.map((suite) => suite.command);

  const width = {
    suite: Math.max("Suite".length, ...labels.map((value) => value.length)),
    tests: Math.max("Tests".length, ...countsStrings.map((value) => value.length)),
    duration: Math.max(
      "Duración".length,
      ...durations.map((value) => value.length),
    ),
    command: Math.max("Comando".length, ...commands.map((value) => value.length)),
  };

  const pad = (value, size) => value.padEnd(size, " ");

  const header =
    `| ${pad("Suite", width.suite)} | ${pad("Tests", width.tests)} | ${pad("Duración", width.duration)} | ${pad("Comando", width.command)} |` +
    `\n| ${"-".repeat(width.suite)} | ${"-".repeat(width.tests)} | ${"-".repeat(width.duration)} | ${"-".repeat(width.command)} |`;

  const rows = suitesConfig.map((suite, index) => {
    const count = countsStrings[index];
    const duration = durations[index];
    const command = commands[index];
    return `| ${pad(suite.label, width.suite)} | ${pad(count, width.tests)} | ${pad(duration, width.duration)} | ${pad(command, width.command)} |`;
  });

  return `\n${[header, ...rows].join("\n")}\n`;
}

function replaceBetween(content, startMarker, endMarker, replacement) {
  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(
      `No se encontraron marcadores ${startMarker} ... ${endMarker}`,
    );
  }

  const before = content.slice(0, startIndex + startMarker.length);
  const after = content.slice(endIndex);

  return `${before}\n${replacement}\n${after}`;
}

function replaceMarker(content, marker, value) {
  const regex = new RegExp(
    `(<!--\\s*${marker}\\s*-->)(.*?)(<!--\\s*/${marker}\\s*-->)`,
    "s",
  );
  if (!regex.test(content)) {
    throw new Error(`No se encontró el marcador ${marker} en el documento`);
  }
  return content.replace(regex, `$1${value}$3`);
}

function updateDocs(parsed) {
  const table = buildTable(parsed.counts);
  const fullCount = parsed.counts.get("full") ?? 0;
  const criticalCount = parsed.counts.get("critical") ?? 0;

  // docs/overview/status.md
  const statusPath = resolve(repoRoot, "docs/overview/status.md");
  let statusContent = readFileSync(statusPath, "utf8");
  statusContent = replaceBetween(
    statusContent,
    "<!-- PLAYWRIGHT_SUITE_TABLE:start -->",
    "<!-- PLAYWRIGHT_SUITE_TABLE:end -->",
    table,
  );
  statusContent = replaceMarker(
    statusContent,
    "PLAYWRIGHT_FULL_COUNT",
    String(fullCount),
  );

  const unitTotalRegex =
    /\*\*Total\*\*:\s+(\d+)\s+pruebas unitarias\/integración passing\s+\(/;
  const unitTotalMatch = unitTotalRegex.exec(statusContent);
  if (!unitTotalMatch) {
    throw new Error("No se pudo inferir el total de unit tests en status.md");
  }
  const unitTotal = Number(unitTotalMatch[1]);
  const combinedTotal = unitTotal + fullCount;
  statusContent = replaceMarker(
    statusContent,
    "PLAYWRIGHT_TOTAL",
    String(combinedTotal),
  );
  statusContent = replaceMarker(
    statusContent,
    "PLAYWRIGHT_FULL_COUNT",
    String(fullCount),
  );

  // docs/development/qa/regression-checklist.md
  const checklistPath = resolve(
    repoRoot,
    "docs/development/qa/regression-checklist.md",
  );
  let checklistContent = readFileSync(checklistPath, "utf8");
  checklistContent = replaceMarker(
    checklistContent,
    "PLAYWRIGHT_CRITICAL_COUNT",
    String(criticalCount),
  );

  return {
    files: [
      { path: statusPath, content: statusContent },
      { path: checklistPath, content: checklistContent },
    ],
  };
}

function run() {
  const output = runPlaywrightList();
  const parsed = parseCounts(output);
  const updates = updateDocs(parsed);

  let hasChanges = false;

  for (const file of updates.files) {
    const current = readFileSync(file.path, "utf8");
    if (current !== file.content) {
      hasChanges = true;
      if (mode === "write") {
        writeFileSync(file.path, file.content, "utf8");
      }
    }
  }

  if (mode === "check") {
    if (hasChanges) {
      console.error(
        "❌ Los conteos de Playwright no coinciden con la documentación. Ejecuta:\n  node scripts/qa/update-playwright-docs.mjs --write",
      );
      process.exit(1);
    }
    console.log("✅ Documentación Playwright sincronizada.");
    return;
  }

  if (mode === "write") {
    if (hasChanges) {
      console.log("✅ Documentación actualizada con los conteos de Playwright.");
    } else {
      console.log("✅ Documentación ya estaba sincronizada.");
    }
  }
}

run();
