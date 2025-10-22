#!/usr/bin/env node
/**
 * Captura un fragmento específico de la landing usando Playwright.
 * Permite generar mockups puntuales (ej. dashboard, módulo RFID, etc.)
 *
 * Uso:
 *   pnpm --filter @brisa/web dev               # en otra terminal, levantar la web
 *   node scripts/capture-landing-section.mjs --selector "[data-mockup='portal']" --out mockup-portal
 *
 * Opciones:
 *   --url <string>        URL base (default: http://localhost:3000)
 *   --selector <string>   Selector CSS del elemento a capturar (obligatorio)
 *   --out <string>        Nombre base del archivo (default: section)
 *   --padding <number>    Padding adicional en px alrededor del elemento (default: 24)
 *
 * El script genera PNG fuente en assets-input/mockups/<ratio>/ y se integra con optimize-landing-assets.sh.
 */

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

function getOption(name, defaultValue) {
  const index = args.findIndex((arg) => arg === name || arg === name.replace("--", "-"));
  if (index === -1) return defaultValue;
  const value = args[index + 1];
  if (!value || value.startsWith("-")) {
    throw new Error(`La opción ${name} requiere un valor.`);
  }
  return value;
}

const selector = getOption("--selector", getOption("-s"));
if (!selector) {
  console.error("❌ Debes indicar --selector \"<css>\" del elemento a capturar.");
  process.exit(1);
}

const outputBase = getOption("--out", "section");
const url = getOption("--url", "http://localhost:3000");
const padding = parseInt(getOption("--padding", "24"), 10);

const OUTPUT_DIR = join(__dirname, "..", "assets-input", "mockups", "raw");
const OUTPUT_FILE = join(OUTPUT_DIR, `${outputBase}.png`);

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  });

  console.log(`📸 Capturando ${selector} desde ${url}`);
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const element = await page.$(selector);
  if (!element) {
    throw new Error(`No se encontró el selector ${selector}.`);
  }

  const box = await element.boundingBox();
  if (!box) {
    throw new Error(`No fue posible obtener el bounding box de ${selector}.`);
  }

  await page.screenshot({
    path: OUTPUT_FILE,
    clip: {
      x: Math.max(box.x - padding, 0),
      y: Math.max(box.y - padding, 0),
      width: box.width + padding * 2,
      height: box.height + padding * 2,
    },
  });

  await browser.close();
  console.log(`✅ Screenshot guardado en ${OUTPUT_FILE}`);
  console.log("ℹ️ Ejecuta './scripts/optimize-landing-assets.sh assets-input' para generar variantes WebP.");
}

main().catch((error) => {
  console.error("❌ Error al capturar la sección:", error);
  process.exit(1);
});
