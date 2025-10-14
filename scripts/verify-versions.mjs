#!/usr/bin/env node

/**
 * Verifica que las versiones declaradas en el código y la documentación
 * estén sincronizadas con los package.json del monorepo.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const errors = [];

const apiPackageJson = JSON.parse(
  readFileSync(resolve("apps/api/package.json"), "utf8"),
);
const webPackageJson = JSON.parse(
  readFileSync(resolve("apps/web/package.json"), "utf8"),
);

const apiVersion = apiPackageJson.version;
const webVersion = webPackageJson.version;

const checks = [
  {
    file: "apps/api/src/app.ts",
    pattern: new RegExp(`version:\\s*["'\`]${escapeRegExp(apiVersion)}["'\`]`),
    description: "apps/api/src/app.ts debe exponer la versión de la API",
  },
  {
    file: "apps/api/src/lib/openapi-spec.ts",
    pattern: new RegExp(
      `version:\\s*["'\`]${escapeRegExp(apiVersion)}["'\`]`,
    ),
    description: "openapi-spec.ts debe usar la versión de la API",
  },
  {
    file: "docs/reference/openapi.yaml",
    pattern: new RegExp(`version:\\s*["']${escapeRegExp(apiVersion)}["']`),
    description: "docs/reference/openapi.yaml debe reflejar la versión de la API",
  },
  {
    file: "docs/reference/api-reference.md",
    pattern: new RegExp(`version:\\s*${escapeRegExp(apiVersion)}`),
    description: "docs/reference/api-reference.md debe reflejar la versión de la API",
  },
  {
    file: "docs/reference/api-reference.md",
    pattern: new RegExp(
      `"version":\\s*"${escapeRegExp(apiVersion)}"`,
    ),
    description:
      "docs/reference/api-reference.md (JSON snippet) debe reflejar la versión de la API",
  },
  {
    file: "docs/overview/status.md",
    pattern: new RegExp(
      "`@brisa/api`\\s*" + escapeRegExp(apiVersion),
    ),
    description: "docs/overview/status.md debe listar @brisa/api con la versión actual",
  },
  {
    file: "docs/overview/status.md",
    pattern: new RegExp(
      "`@brisa/web`\\s*" + escapeRegExp(webVersion),
    ),
    description: "docs/overview/status.md debe listar @brisa/web con la versión actual",
  },
];

for (const check of checks) {
  const content = readFileSync(resolve(check.file), "utf8");
  if (!check.pattern.test(content)) {
    errors.push(`❌ ${check.description} (${check.file})`);
  }
}

if (errors.length > 0) {
  console.error("Version check failed:\n" + errors.join("\n"));
  process.exit(1);
}

console.log(
  `✅ Versiones sincronizadas: API ${apiVersion} · Web ${webVersion}`,
);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
