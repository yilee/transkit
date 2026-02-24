#!/usr/bin/env node
import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Load .env from the package root (two levels up from dist/)
dotenvConfig({ path: resolve(__dirname, '../../../.env') });
dotenvConfig(); // fallback: also try cwd
import { translate, detectLanguage, getTargetLanguage, loadConfig } from '@transkit/core';

function printUsage(): void {
  console.log(`Usage: transkit <text> [options]

Options:
  --from <lang>   Source language (en, zh-Hans, zh-Hant). Auto-detected if omitted.
  --to   <lang>   Target language (en, zh-Hans, zh-Hant). Auto-detected if omitted.
  --help          Show this help message.

Examples:
  transkit "Hello, world!"
  transkit "你好世界"
  transkit "Good morning" --to zh-Hans
  transkit "早上好" --to en
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  // Parse flags
  let fromLang: string | undefined;
  let toLang: string | undefined;
  const textParts: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--from' && i + 1 < args.length) {
      fromLang = args[++i];
    } else if (args[i] === '--to' && i + 1 < args.length) {
      toLang = args[++i];
    } else if (!args[i].startsWith('--')) {
      textParts.push(args[i]);
    }
  }

  const text = textParts.join(' ').trim();
  if (!text) {
    console.error('Error: no text provided.');
    printUsage();
    process.exit(1);
  }

  let config;
  try {
    config = loadConfig();
  } catch (err) {
    console.error(`Configuration error: ${(err as Error).message}`);
    console.error('Make sure TRANSLATOR_API_KEY and TRANSLATOR_REGION are set in your .env file.');
    process.exit(1);
  }

  const detectedSource = detectLanguage(text);
  const source = (fromLang ?? detectedSource) as Parameters<typeof translate>[1];
  const target = (toLang ?? getTargetLanguage(detectedSource)) as Parameters<typeof translate>[1];

  try {
    const result = await translate(text, target, config, source);
    console.log(result.text);
  } catch (err) {
    console.error(`Translation failed: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
