import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const bundledPath = path.join(__dirname, 'dist', 'server.cjs');

// If dist/server.cjs does not exist, run build first
if (!fs.existsSync(bundledPath)) {
  console.log('[server.js] dist/server.cjs not found, running build...');
  const { execSync } = require('node:child_process');
  execSync('npm run build', { stdio: 'inherit' });
}

// Synchronously load the bundled production server (no top-level await)
require(bundledPath);
