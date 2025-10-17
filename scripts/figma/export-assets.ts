#!/usr/bin/env tsx
/**
 * Figma Asset Exporter
 *
 * Exports images and design tokens from Figma to the repository.
 *
 * Usage:
 *   pnpm figma:export
 *
 * Requirements:
 *   - FIGMA_ACCESS_TOKEN (in .env.local)
 *   - FIGMA_FILE_KEY (in .env.local)
 *
 * @see https://www.figma.com/developers/api
 */

import * as Figma from "figma-js";
import * as fs from "fs/promises";
import * as path from "path";
import { execSync } from "child_process";

// Configuration
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY;
const OUTPUT_DIR = path.join(process.cwd(), "docs/assets/public-components");

// Node names in Figma (customize based on your design)
const ASSET_NODES = {
  "hero-background": "Hero Background Image",
  "cta-illustration": "CTA Illustration",
  "features-icon": "Features Icon Set",
};

// Validation
if (!FIGMA_ACCESS_TOKEN) {
  console.error("❌ Error: FIGMA_ACCESS_TOKEN no configurado");
  console.error("   Configura tu token en .env.local");
  console.error(
    "   Obtén tu token en: https://www.figma.com/developers/api#access-tokens",
  );
  process.exit(1);
}

if (!FIGMA_FILE_KEY) {
  console.error("❌ Error: FIGMA_FILE_KEY no configurado");
  console.error("   Formato: FIGMA_FILE_KEY=abc123xyz (de la URL de Figma)");
  console.error(
    "   Ejemplo URL: https://www.figma.com/file/abc123xyz/Design-File-Name",
  );
  process.exit(1);
}

const client = Figma.Client({ personalAccessToken: FIGMA_ACCESS_TOKEN });

/**
 * Main export function
 */
async function exportAssets() {
  console.log("🎨 Exportando assets desde Figma...\n");

  try {
    // 1. Get file structure
    console.log("📂 Obteniendo estructura del archivo Figma...");
    const file = await client.file(FIGMA_FILE_KEY);

    console.log(`✅ Archivo: ${file.data.name}`);
    console.log(`   Última modificación: ${file.data.lastModified}\n`);

    // 2. Find nodes to export
    const nodeIds = findNodeIds(file.data.document);

    if (nodeIds.length === 0) {
      console.warn("⚠️  No se encontraron nodos para exportar");
      console.warn("   Verifica los nombres en ASSET_NODES");
      return;
    }

    console.log(`📦 Encontrados ${nodeIds.length} assets para exportar\n`);

    // 3. Export images
    console.log("🖼️  Solicitando URLs de exportación...");
    const images = await client.fileImages(FIGMA_FILE_KEY, {
      ids: nodeIds,
      format: "png",
      scale: 2, // 2x for retina displays
    });

    if (!images.data.images) {
      console.error("❌ Error: No se obtuvieron URLs de imágenes");
      return;
    }

    // 4. Download and save images
    console.log("⬇️  Descargando imágenes...\n");
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    for (const [nodeId, imageUrl] of Object.entries(images.data.images)) {
      const nodeName = getNodeName(nodeId, file.data.document);
      const fileName = sanitizeFileName(nodeName);
      const filePath = path.join(OUTPUT_DIR, `${fileName}@2x.png`);

      console.log(`   → ${fileName}@2x.png`);

      // Download image
      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(buffer));

      // Optimize with pngquant (if available)
      try {
        execSync(`pngquant --quality=80-95 --ext .png --force "${filePath}"`, {
          stdio: "ignore",
        });
        console.log(`     ✓ Optimizado con pngquant`);
      } catch {
        console.log(
          `     ⚠ pngquant no disponible (instala: apt install pngquant)`,
        );
      }
    }

    console.log("\n✅ Exportación completada!");
    console.log(`📁 Assets guardados en: ${OUTPUT_DIR}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Error:", error.message);
      if (error.message.includes("403")) {
        console.error("   Verifica que tu FIGMA_ACCESS_TOKEN sea válido");
      }
      if (error.message.includes("404")) {
        console.error("   Verifica que FIGMA_FILE_KEY sea correcto");
      }
    }
    process.exit(1);
  }
}

/**
 * Find node IDs to export based on ASSET_NODES configuration
 */
function findNodeIds(node: any, ids: string[] = []): string[] {
  if (node.name && Object.values(ASSET_NODES).includes(node.name)) {
    ids.push(node.id);
  }

  if (node.children) {
    for (const child of node.children) {
      findNodeIds(child, ids);
    }
  }

  return ids;
}

/**
 * Get node name by ID
 */
function getNodeName(nodeId: string, document: any): string {
  function search(node: any): string | null {
    if (node.id === nodeId) {
      return node.name;
    }
    if (node.children) {
      for (const child of node.children) {
        const result = search(child);
        if (result) return result;
      }
    }
    return null;
  }

  return search(document) || "unnamed";
}

/**
 * Sanitize file name for filesystem
 */
function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Run export
exportAssets();
