#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const port = process.env.PORT ?? '3000';

const child = spawn(
  'node',
  ['server.js'],
  {
    cwd: path.resolve(__dirname, '..', '.next/standalone'),
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: port,
      HOSTNAME: '0.0.0.0'
    }
  }
);

child.on('close', (code) => {
  process.exit(code ?? 0);
});
