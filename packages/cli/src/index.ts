#!/usr/bin/env node
import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';

// --- .env loading (priority: cwd > ~/.config/transkit/.env) ---
// System environment variables always take precedence over .env files;
// dotenvConfig does not override already-set variables by default.
const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv(): void {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(homedir(), '.config', 'transkit', '.env'),
    // fallback: .env next to the source tree root (dev / npm link usage)
    resolve(__dirname, '../../../.env'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      dotenvConfig({ path: p });
      break;
    }
  }
}

loadEnv();

// Dynamic import AFTER env is loaded to avoid ES module hoisting issue.
const { translate, detectLanguage, getTargetLanguage, loadConfig } =
  await import('@transkit/core');

// --- helpers ---

function printUsage(): void {
  console.log(`Usage: f <text> [options]
       echo <text> | f

Options:
  --from <lang>   Source language (en, zh-Hans, zh-Hant). Auto-detected if omitted.
  --to   <lang>   Target language (en, zh-Hans, zh-Hant). Auto-detected if omitted.
  -v, --verbose   Show detected source and target language.
  -h, --help      Show this help message.

Examples:
  f "Hello, world!"
  f 你好世界
  f "Good morning" --to zh-Hans
  f "早上好" --to en -v
  echo "Hello" | f
`);
}

async function readStdin(): Promise<string> {
  return new Promise((res) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => res(data.trim()));
    // If stdin is a TTY (interactive terminal) there is nothing to read.
    if (process.stdin.isTTY) res('');
  });
}

// --- main ---

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  // Parse flags
  let fromLang: string | undefined;
  let toLang: string | undefined;
  let verbose = false;
  const textParts: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--from' && i + 1 < args.length) {
      fromLang = args[++i];
    } else if (args[i] === '--to' && i + 1 < args.length) {
      toLang = args[++i];
    } else if (args[i] === '--verbose' || args[i] === '-v') {
      verbose = true;
    } else if (!args[i].startsWith('-')) {
      textParts.push(args[i]);
    }
  }

  // Resolve text: inline args first, then stdin
  let text = textParts.join(' ').trim();
  if (!text) {
    text = await readStdin();
  }

  if (!text) {
    printUsage();
    process.exit(0);
  }

  let config;
  try {
    config = loadConfig();
  } catch (err) {
    console.error(`Configuration error: ${(err as Error).message}`);
    console.error(
      'Set TRANSLATOR_API_KEY and TRANSLATOR_REGION via environment variable,\n' +
      'a .env file in the current directory, or ~/.config/transkit/.env',
    );
    process.exit(1);
  }

  const detectedSource = detectLanguage(text);
  const source = (fromLang ?? detectedSource) as Parameters<typeof translate>[1];
  const target = (toLang ?? getTargetLanguage(detectedSource)) as Parameters<typeof translate>[1];

  try {
    const result = await translate(text, target, config, source);
    if (verbose) {
      console.error(`[${result.from} → ${result.to}]`);
    }
    console.log(result.text);
  } catch (err) {
    console.error(`Translation failed: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
