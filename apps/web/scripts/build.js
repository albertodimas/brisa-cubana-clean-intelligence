#!/usr/bin/env node
const { spawn } = require("node:child_process");

const passthroughArgs = process.argv
  .slice(2)
  .filter((arg) => arg !== "--" && !arg.startsWith("--filter="));

const child = spawn("next", ["build", ...passthroughArgs], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code === undefined ? 1 : code);
});
