#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(__filename, "..", "..");

const uiDir = "apps/web/components/ui";
const landingDir = "apps/web/components/landing";

const managerComponents = [
  "apps/web/components/bookings-manager.tsx",
  "apps/web/components/services-manager.tsx",
  "apps/web/components/users-manager.tsx",
  "apps/web/components/properties-manager.tsx",
  "apps/web/components/customers-manager.tsx",
  "apps/web/components/admin-panel.tsx",
];

const IGNORED_FILENAMES = new Set([
  "index.ts",
  "index.tsx",
  "types.ts",
  "types.tsx",
]);

async function listComponentFiles(dirRelative) {
  const dirPath = path.join(repoRoot, dirRelative);
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  return entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".tsx") &&
        !entry.name.endsWith(".stories.tsx") &&
        !entry.name.endsWith(".test.tsx") &&
        !IGNORED_FILENAMES.has(entry.name),
    )
    .map((entry) => ({
      componentPath: path.join(dirRelative, entry.name),
      storyPath: path.join(
        dirRelative,
        entry.name.replace(/\.tsx$/, ".stories.tsx"),
      ),
    }));
}

async function ensureStoriesExist(descriptors) {
  const missing = [];

  for (const descriptor of descriptors) {
    try {
      await fs.access(path.join(repoRoot, descriptor.storyPath));
    } catch {
      missing.push(descriptor);
    }
  }

  return missing;
}

async function main() {
  const uiDescriptors = await listComponentFiles(uiDir);
  const landingDescriptors = await listComponentFiles(landingDir);

  const managerDescriptors = managerComponents.map((componentPath) => ({
    componentPath,
    storyPath: componentPath.replace(/\.tsx$/, ".stories.tsx"),
  }));

  const missingUi = await ensureStoriesExist(uiDescriptors);
  const missingLanding = await ensureStoriesExist(landingDescriptors);
  const missingManagers = await ensureStoriesExist(managerDescriptors);

  const missingAll = [
    { label: "UI", items: missingUi },
    { label: "Landing", items: missingLanding },
    { label: "Managers", items: missingManagers },
  ].filter((group) => group.items.length > 0);

  if (missingAll.length > 0) {
    console.error("❌ Storybook coverage incompleta:");
    for (const group of missingAll) {
      console.error(`\n${group.label}:`);
      for (const item of group.items) {
        console.error(
          `  • Falta ${item.storyPath} (componente ${item.componentPath})`,
        );
      }
    }
    process.exit(1);
  }

  console.log("✅ Storybook coverage al 100% para UI, Landing y Managers.");
}

main().catch((error) => {
  console.error("❌ Error verificando cobertura Storybook:", error);
  process.exit(1);
});
