#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

const pnpmBin = process.env.PNPM_BIN || 'pnpm';

const result = spawnSync(pnpmBin, process.argv.slice(2), { stdio: 'inherit' });

process.exit(result.status ?? 1);
