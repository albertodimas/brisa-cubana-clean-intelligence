#!/usr/bin/env node
import { globby } from "globby";
import { mkdir } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execa } from "execa";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const sourceDir = resolve(root, "docs/resources/diagrams");
const outputDir = resolve(root, "docs/_build/diagrams");

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

async function main() {
  const files = await globby("**/*.mmd", { cwd: sourceDir, absolute: true });

  if (files.length === 0) {
    console.info("[diagrams] No Mermaid files found, skipping");
    return;
  }

  await ensureDir(outputDir);

  for (const file of files) {
    const rel = relative(sourceDir, file);
    const target = resolve(outputDir, rel.replace(/\.mmd$/, ".svg"));
    await ensureDir(dirname(target));
    console.info(`[diagrams] Rendering ${rel} -> ${relative(root, target)}`);
    try {
      const { stdout, stderr } = await execa(
        "npx",
        ["mmdc", "-i", file, "-o", target],
        {
          stdout: "pipe",
          stderr: "pipe",
        },
      );
      if (stdout) {
        console.log(stdout.trim());
      }
      if (stderr) {
        console.error(stderr.trim());
      }
    } catch (error) {
      const errorText =
        `${error.message ?? ""}\n${error.stderr ?? ""}\n${error.stdout ?? ""}`.toLowerCase();
      if (errorText.includes("chromium")) {
        console.warn(
          "[diagrams] Mermaid CLI requires a Chromium binary. Run `pnpm approve-builds puppeteer` or install a system Chromium and set PUPPETEER_EXECUTABLE_PATH. Skipping diagram render.",
        );
        return;
      }
      throw error;
    }
  }
}

main().catch((error) => {
  console.error("[diagrams] Failed to render diagrams", error);
  process.exit(1);
});
