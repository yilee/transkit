import { build } from 'esbuild';
import { writeFileSync, readFileSync } from 'fs';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile: 'dist/index.cjs',
  minify: false,
  sourcemap: false,
  logLevel: 'info',
});

// Prepend shebang — CJS output doesn't support esbuild banner with shebang cleanly
const content = readFileSync('dist/index.cjs', 'utf8');
if (!content.startsWith('#!')) {
  writeFileSync('dist/index.cjs', '#!/usr/bin/env node\n' + content, 'utf8');
}
