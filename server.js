import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bundledPath = path.join(__dirname, 'dist', 'server.cjs');

// If dist/server.cjs does not exist, run build first
if (!fs.existsSync(bundledPath)) {
  console.log('[server.js] dist/server.cjs not found, running build...');
  execSync('npm run build', { stdio: 'inherit' });
}

// Execute the bundled production server
await import('./dist/server.cjs');
