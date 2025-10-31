#!/usr/bin/env node
/**
 * Valida que el mensaje de commit siga Conventional Commits.
 * Uso: node scripts/git/check-commit-message.mjs .git/COMMIT_EDITMSG
 */
import { readFileSync } from "node:fs";

const ALLOWED_TYPES = [
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
  "revert",
  "ops",
  "infra",
];

const filePath = process.argv[2];

if (!filePath) {
  console.error("❌ Debes pasar la ruta del mensaje de commit.");
  process.exit(1);
}

const message = readFileSync(filePath, "utf8").trim();

const regex = new RegExp(
  `^(${ALLOWED_TYPES.join("|")})(\\([\\w.-]+\\))?: \\S`,
);

if (!regex.test(message)) {
  console.error("❌ Mensaje de commit inválido.");
  console.error(
    "El formato esperado es: tipo(scope opcional): descripción. Tipos permitidos:",
  );
  console.error(`  ${ALLOWED_TYPES.join(", ")}`);
  process.exit(1);
}

process.exit(0);
