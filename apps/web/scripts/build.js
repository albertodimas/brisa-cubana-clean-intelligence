#!/usr/bin/env node
const { spawn } = require("node:child_process");

const passthroughArgs = process.argv
  .slice(2)
  .filter((arg) => arg !== "--" && !arg.startsWith("--filter="));

const isAnalyze =
  typeof process.env.ANALYZE === "string" &&
  ["1", "true", "TRUE"].includes(process.env.ANALYZE);

const forwardedArgs = [...passthroughArgs];

if (
  isAnalyze &&
  !forwardedArgs.some((arg) => arg === "--webpack" || arg === "--turbo")
) {
  // Analyzer solo soporta Webpack hoy; forzamos esa bandera si no viene explícita.
  forwardedArgs.push("--webpack");
}

const child = spawn("next", ["build", ...forwardedArgs], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code === undefined ? 1 : code);
});
