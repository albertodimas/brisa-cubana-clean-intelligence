#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..", "..");
const nextDir = join(repoRoot, "apps", "web", ".next");
const analyzeDir = join(nextDir, "analyze");

const toKB = (bytes) => Number((bytes / 1024).toFixed(2));

const readFileBytes = (relativePath) => {
  const absolutePath = join(nextDir, relativePath);
  const buffer = readFileSync(absolutePath);
  return {
    file: relativePath,
    bytes: buffer.length,
    gzipBytes: gzipSync(buffer).length,
  };
};

const findRouteChunk = (route) => {
  const segments = route === "/" ? [] : route.split("/").filter(Boolean);
  const dir = join(
    nextDir,
    "static",
    "chunks",
    "app",
    ...segments.map((segment) => segment),
  );
  const entry = readdirSync(dir).find(
    (name) => name.startsWith("page-") && name.endsWith(".js"),
  );
  if (!entry) {
    throw new Error(`No se encontró chunk para la ruta ${route} en ${dir}`);
  }
  const relative = join(
    "static",
    "chunks",
    "app",
    ...segments.map((segment) => segment),
    entry,
  );
  return readFileBytes(relative);
};

const buildManifest = JSON.parse(
  readFileSync(join(nextDir, "build-manifest.json"), "utf8"),
);

const firstLoadStats = buildManifest.rootMainFiles.map(readFileBytes);

const routeMap = [
  "/",
  "/panel",
  "/clientes",
  "/clientes/[customerId]",
  "/clientes/[customerId]/reservas/[bookingId]",
  "/checkout",
  "/login",
];

const routeStats = routeMap.map((route) => ({
  route,
  ...findRouteChunk(route),
}));

const clientStatsPath = join(analyzeDir, "client.json");
const clientStatsRaw = JSON.parse(readFileSync(clientStatsPath, "utf8"));

const chunkMatches = (node, predicate) => {
  if (predicate(node)) {
    return true;
  }
  if (!node.groups) {
    return false;
  }
  return node.groups.some((child) => chunkMatches(child, predicate));
};

const sentryChunk = clientStatsRaw.find((node) =>
  chunkMatches(
    node,
    (item) =>
      typeof item.label === "string" &&
      item.label.toLowerCase().includes("@sentry"),
  ),
);

const middlewareStats = (() => {
  try {
    const buffer = readFileSync(join(nextDir, "server", "middleware.js"));
    return {
      file: "server/middleware.js",
      bytes: buffer.length,
      gzipBytes: gzipSync(buffer).length,
    };
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return {
        file: "server/middleware.js",
        bytes: 0,
        gzipBytes: 0,
      };
    }
    throw error;
  }
})();

const formatEntry = (entry) => ({
  file: entry.file,
  rawKB: toKB(entry.bytes),
  gzipKB: toKB(entry.gzipBytes),
});

const output = {
  generatedAt: new Date().toISOString(),
  firstLoad: {
    totalRawKB: toKB(firstLoadStats.reduce((acc, item) => acc + item.bytes, 0)),
    totalGzipKB: toKB(
      firstLoadStats.reduce((acc, item) => acc + item.gzipBytes, 0),
    ),
    files: firstLoadStats.map(formatEntry),
  },
  routes: routeStats.map((item) => ({
    route: item.route,
    ...formatEntry(item),
  })),
  sentryChunk: sentryChunk
    ? {
        file: sentryChunk.label,
        rawKB: toKB(sentryChunk.statSize),
        parsedKB: toKB(sentryChunk.parsedSize ?? sentryChunk.statSize),
        gzipKB: toKB(sentryChunk.gzipSize ?? sentryChunk.parsedSize ?? 0),
      }
    : null,
  middleware: formatEntry(middlewareStats),
};

const asMarkdown = process.argv.includes("--markdown");

if (!asMarkdown) {
  console.log(JSON.stringify(output, null, 2));
} else {
  console.log(`# Bundle Summary (${output.generatedAt})`);
  console.log(
    `- First load JS (gzip): ${output.firstLoad.totalGzipKB} kB ` +
      `(raw ${output.firstLoad.totalRawKB} kB)`,
  );
  for (const file of output.firstLoad.files) {
    console.log(
      `  - ${file.file}: ${file.gzipKB} kB gzip (${file.rawKB} kB raw)`,
    );
  }
  console.log(`- Routes:`);
  for (const route of output.routes) {
    console.log(
      `  - ${route.route}: ${route.gzipKB} kB gzip (${route.rawKB} kB raw)`,
    );
  }
  if (output.sentryChunk) {
    console.log(
      `- Sentry chunk ${output.sentryChunk.file}: ${output.sentryChunk.parsedKB} kB parsed (${output.sentryChunk.gzipKB} kB gzip)`,
    );
  }
  console.log(
    `- Middleware (${output.middleware.file}): ${output.middleware.gzipKB} kB gzip (${output.middleware.rawKB} kB raw)`,
  );
}
