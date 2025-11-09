#!/usr/bin/env node

/**
 * Sincroniza HEALTH_CHECK_TOKEN entre Vercel (API) y GitHub Secrets.
 *
 * Uso:
 *   pnpm env:sync-health-token
 *
 * Requisitos:
 * - Sesión iniciada en Vercel CLI (`vercel login`) con acceso al equipo `brisa-cubana`.
 * - GitHub CLI autenticado con permisos para `repo`/`actions:write`.
 *
 * Flujo:
 * 1. Ejecuta `vercel env pull` en `apps/api` para obtener los envs de producción.
 * 2. Extrae HEALTH_CHECK_TOKEN del archivo temporal.
 * 3. Lo escribe en el secreto del repositorio vía `gh secret set`.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const apiDir = path.join(repoRoot, "apps", "api");
const tempDir = path.join(repoRoot, "tmp");
const envFile = path.join(tempDir, `.env.vercel.${Date.now()}`);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    ...options,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} terminó con código ${result.status}`,
    );
  }
}

function readHeathToken(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`El archivo temporal ${filePath} no existe.`);
  }
  const content = fs.readFileSync(filePath, "utf8");
  const match = content.match(
    /^HEALTH_CHECK_TOKEN=(?:"([^"]+)"|([^\n\r]+))$/m,
  );
  if (!match) {
    throw new Error(
      "HEALTH_CHECK_TOKEN no encontrado en el env exportado de Vercel.",
    );
  }
  return (match[1] ?? match[2] ?? "").trim();
}

async function main() {
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  console.log("⬇️  Descargando envs de producción (Vercel)...");
  run(
    "vercel",
    ["env", "pull", envFile, "--environment", "production", "--scope", "brisa-cubana"],
    { cwd: apiDir },
  );

  try {
    const token = readHeathToken(envFile);
    if (!token) {
      throw new Error("HEALTH_CHECK_TOKEN está vacío.");
    }

    console.log("🔐 Actualizando secreto HEALTH_CHECK_TOKEN en GitHub...");
    const ghResult = spawnSync(
      "gh",
      ["secret", "set", "HEALTH_CHECK_TOKEN"],
      {
        input: token,
        stdio: ["pipe", "inherit", "inherit"],
      },
    );
    if (ghResult.error) {
      throw ghResult.error;
    }
    if (ghResult.status !== 0) {
      throw new Error("gh secret set falló.");
    }

    console.log("✅ Sincronización completada.");
  } finally {
    if (fs.existsSync(envFile)) {
      fs.rmSync(envFile);
    }
  }
}

main().catch((error) => {
  console.error("❌ Error al sincronizar HEALTH_CHECK_TOKEN:", error.message);
  process.exitCode = 1;
});
