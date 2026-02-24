import { cpSync, mkdirSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = resolve(__dirname, 'dist');

// Copy static assets into dist/
const statics = ['manifest.json', 'popup.html', 'content.css', 'icons'];
for (const f of statics) {
  const src = resolve(__dirname, f);
  const dest = resolve(out, f);
  try {
    cpSync(src, dest, { recursive: true });
  } catch {
    // file may not exist yet (e.g. icons placeholder)
  }
}

console.log('Extension built to dist/');
