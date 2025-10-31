#!/usr/bin/env node

/**
 * Env sync helper (fase inicial)
 *
 * - Lee `config/env.manifest.json`
 * - Verifica que `.env.local` contenga las variables requeridas
 * - Resume qué claves faltan o están vacías
 *
 * En siguientes iteraciones se integrará con Vercel/GitHub Actions para
 * sincronizar automáticamente, pero esto nos da una fuente única inicial.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = path.join(process.cwd());
const manifestPath = path.join(repoRoot, "config", "env.manifest.json");
const envLocalPath = path.join(repoRoot, ".env.local");

function readManifest() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error("config/env.manifest.json no encontrado");
  }
  const raw = fs.readFileSync(manifestPath, "utf8");
  return JSON.parse(raw);
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  const result = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, "");
    result[key] = value;
  }
  return result;
}

function reportMissing(manifest, envValues) {
  const missing = [];
  for (const variable of manifest.variables) {
    if (!variable.required) continue;
    const value = envValues[variable.key];
    if (!value) {
      missing.push(variable);
    }
  }
  return missing;
}

function main() {
  const manifest = readManifest();
  const envLocal = parseEnvFile(envLocalPath);

  const missingLocal = reportMissing(manifest, envLocal);

  console.log("🌱  Env manifest:", manifestPath);
  console.log("📄  .env.local:", fs.existsSync(envLocalPath) ? "encontrado" : "no existe");
  console.log("");

  if (missingLocal.length === 0) {
    console.log("✅  .env.local contiene todas las variables requeridas.");
  } else {
    console.log("⚠️  Faltan variables requeridas en .env.local:");
    for (const variable of missingLocal) {
      console.log(
        `   - ${variable.key} (${variable.scopes?.join(", ") ?? "general"}): ${variable.description}`,
      );
    }
  }

  console.log("\nPróximos pasos:");
  console.log("1. Usa `vercel env pull` para traer valores actuales (preview/production).");
  console.log("2. Copia los valores que falten en `.env.local` y confirma que coinciden con el manifest.");
  console.log(
    "3. Actualiza `config/env.manifest.json` cuando agregues o retires variables (evita duplicidades).",
  );
}

main();
