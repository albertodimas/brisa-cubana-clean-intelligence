#!/usr/bin/env node
/**
 * Captura la sección hero de la landing usando Playwright.
 * Requiere que el servidor web esté corriendo en http://localhost:3000.
 *
 * Uso:
 *   pnpm --filter @brisa/web dev
 *   # en otra terminal:
 *   node scripts/capture-landing-hero.mjs
 *
 * El archivo se guarda en assets-input/hero/hero-source.png
 */

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "assets-input", "hero");
const OUTPUT_FILE = join(OUTPUT_DIR, "hero-source.png");
const LANDING_URL = process.env.LANDING_URL ?? "http://localhost:3000";

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 2400, height: 1600 },
    deviceScaleFactor: 1,
  });

  console.log(`📸 Abriendo ${LANDING_URL} ...`);
  await page.goto(LANDING_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // Fijamos el scroll en la parte superior para asegurar la captura del hero.
  await page.evaluate(() => window.scrollTo(0, 0));

  await page.screenshot({
    path: OUTPUT_FILE,
    clip: { x: 0, y: 0, width: 2400, height: 1600 },
  });

  await browser.close();
  console.log(`✅ Screenshot guardado en ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error("❌ Error al capturar el hero:", error);
  process.exit(1);
});
