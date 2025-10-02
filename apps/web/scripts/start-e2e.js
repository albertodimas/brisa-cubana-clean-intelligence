#!/usr/bin/env node
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const port = process.env.PORT ?? "3000";
const appHost = process.env.E2E_APP_HOST ?? "localhost";
const appBaseUrl = `http://${appHost}:${port}`;

const rootDir = path.resolve(__dirname, "..", "..", "..");
const standaloneRoot = path.resolve(__dirname, "..", ".next/standalone");

function ensureStaticAssets(entryPath) {
  const entryDir = path.dirname(entryPath);

  const staticSource = path.resolve(__dirname, "..", ".next/static");
  const staticDestination = path.join(entryDir, ".next/static");
  if (fs.existsSync(staticSource)) {
    fs.mkdirSync(path.dirname(staticDestination), { recursive: true });
    fs.rmSync(staticDestination, { recursive: true, force: true });
    fs.cpSync(staticSource, staticDestination, { recursive: true });
    console.log("[e2e] Copied Next.js static assets to", staticDestination);
  }

  const publicSource = path.resolve(__dirname, "..", "public");
  const publicDestination = path.join(entryDir, "public");
  if (fs.existsSync(publicSource)) {
    fs.rmSync(publicDestination, { recursive: true, force: true });
    fs.cpSync(publicSource, publicDestination, { recursive: true });
    console.log("[e2e] Copied public assets to", publicDestination);
  }
}

async function waitForApiReady(url, attempts = 30, delayMs = 500) {
  for (let index = 0; index < attempts; index++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // ignore and retry
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
}

function ensureEntry() {
  const entryCandidates = [
    path.join(standaloneRoot, "server.js"),
    path.join(standaloneRoot, "apps", "web", "server.js"),
  ];
  return entryCandidates.find((candidate) => fs.existsSync(candidate));
}

const entry = ensureEntry();

if (!entry) {
  console.error(
    "[e2e] No se encontró server.js en la build standalone de Next.js. Ejecuta `pnpm --filter=web build` antes de correr Playwright.",
  );
  process.exit(1);
}

ensureStaticAssets(entry);

const children = [];
let shuttingDown = false;

function terminateChildren() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
}

function shutdown(code = 0) {
  terminateChildren();
  process.exit(code);
}

process.on("SIGINT", () => shutdown(130));
process.on("SIGTERM", () => shutdown(143));
process.on("exit", terminateChildren);

// Levanta la API antes de iniciar Next.js
const apiPort = process.env.API_PORT ?? "3001";
const defaultDatabaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5433/brisa_cubana_dev";

const apiEnv = {
  ...process.env,
  NODE_ENV: process.env.API_NODE_ENV ?? "test",
  API_PORT: apiPort,
  PORT: apiPort,
  DATABASE_URL: defaultDatabaseUrl,
  JWT_SECRET: process.env.JWT_SECRET ?? "test-secret",
  AUTH_DEMO_USERS:
    process.env.AUTH_DEMO_USERS ??
    [
      "admin@brisacubanaclean.com:Admin123!",
      "staff@brisacubanaclean.com:Staff123!",
      "client@brisacubanaclean.com:Client123!",
    ].join(","),
  WEB_APP_URL: process.env.WEB_APP_URL ?? appBaseUrl,
  REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6380",
  LOG_LEVEL: process.env.LOG_LEVEL ?? "warn",
  ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING ?? "false",
  DYLD_USE_FAKE_API_DATA: process.env.DYLD_USE_FAKE_API_DATA ?? "1",
  USE_FAKE_API_DATA: process.env.USE_FAKE_API_DATA ?? "1",
};

const seedProcess = spawn("pnpm", ["--filter=@brisa/api", "db:seed"], {
  cwd: rootDir,
  stdio: "inherit",
  env: apiEnv,
});

children.push(seedProcess);

seedProcess.on("exit", (seedCode) => {
  if (seedCode !== 0) {
    console.error("\n[e2e] Falló la siembra de datos para las pruebas. Abortando.");
    shutdown(seedCode ?? 1);
    return;
  }

  const apiProcess = spawn("pnpm", ["--filter=@brisa/api", "start"], {
    cwd: rootDir,
    stdio: "inherit",
    env: apiEnv,
  });

  children.push(apiProcess);

  apiProcess.on("exit", (code) => {
    if (code !== 0) {
      console.error(`\n[e2e] La API terminó con código ${code}. Abortando pruebas.`);
      shutdown(code ?? 1);
    }
  });

  async function startNextServer() {
    const apiHost = process.env.E2E_API_HOST ?? "localhost";
    const apiBaseUrl = `http://${apiHost}:${apiPort}`;

    const ready = await waitForApiReady(`${apiBaseUrl}/health`, 40, 500);
    if (!ready) {
      console.error("\n[e2e] La API no respondió al health check. Abortando.");
      shutdown(1);
      return;
    }

    const nextProcess = spawn("node", [entry], {
      cwd: path.dirname(entry),
      stdio: "inherit",
      env: {
        ...process.env,
        PORT: port,
        HOSTNAME: "0.0.0.0",
        AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST ?? "1",
        NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? appBaseUrl,
        AUTH_URL: process.env.AUTH_URL ?? appBaseUrl,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "test-secret",
        AUTH_SECRET: process.env.AUTH_SECRET ?? "test-secret",
        NEXT_PUBLIC_API_URL:
          process.env.NEXT_PUBLIC_API_URL ?? apiBaseUrl,
        API_URL: process.env.API_URL ?? apiBaseUrl,
        DYLD_USE_FAKE_API_DATA:
          process.env.DYLD_USE_FAKE_API_DATA ?? "1",
        USE_FAKE_API_DATA:
          process.env.USE_FAKE_API_DATA ?? "1",
        NEXT_PUBLIC_USE_FAKE_API_DATA:
          process.env.NEXT_PUBLIC_USE_FAKE_API_DATA ?? "1",
      },
    });

    children.push(nextProcess);

    nextProcess.on("close", (code) => {
      shutdown(code ?? 0);
    });
  }

  const nextDelayMs = Number(process.env.E2E_NEXT_DELAY_MS ?? 2000);
  setTimeout(startNextServer, nextDelayMs);
});
