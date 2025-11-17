#!/usr/bin/env node
import { cp, rm, rename, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function log(message) {
  console.log(`[vercel:deps] ${message}`);
}

async function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: __dirname + "/..",
      stdio: "inherit",
      shell: false,
    });

    child.on("error", (error) => reject(error));
    child.on("close", (code) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

async function prepare() {
  if (!process.env.VERCEL && process.env.FORCE_VERCEL_DEPS !== "true") {
    log(
      "Entorno local detectado. Omite preparación de dependencias para evitar alterar el workspace.",
    );
    return;
  }

  const projectRoot = dirname(__dirname);
  const deployDir = `${projectRoot}/deploy`;
  const nodeModulesDir = `${projectRoot}/node_modules`;
  const serverlessNodeModulesDir = `${projectRoot}/../api/node_modules`;

  log("Limpieza de la carpeta deploy previa.");
  await rm(deployDir, { recursive: true, force: true });

  log("Generando copia desplegable con pnpm deploy...");
  await run("pnpm", ["deploy", "--filter", "@brisa/api", "deploy"]);

  const deployNodeModules = `${deployDir}/node_modules`;
  try {
    await stat(deployNodeModules);
  } catch {
    throw new Error(
      "No se generó deploy/node_modules; pnpm deploy no produjo dependencias.",
    );
  }

  log("Sustituyendo node_modules por la versión sin symlinks.");
  await rm(nodeModulesDir, { recursive: true, force: true });
  await rename(deployNodeModules, nodeModulesDir);

  log("Replicando dependencias en api/node_modules para la función serverless.");
  await rm(serverlessNodeModulesDir, { recursive: true, force: true });
  await cp(nodeModulesDir, serverlessNodeModulesDir, { recursive: true });

  log("Eliminando carpeta deploy temporal.");
  await rm(deployDir, { recursive: true, force: true });

  log("Dependencias preparadas para Vercel.");
}

prepare().catch((error) => {
  console.error("[vercel:deps] Error preparando dependencias:", error);
  process.exitCode = 1;
});
