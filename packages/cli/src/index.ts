#!/usr/bin/env node
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { homedir } from 'os';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import * as readline from 'readline';
import { translate, detectLanguage, getTargetLanguage, loadConfig, getCached, setCached } from '@transkit/core';

// --- .env loading (priority: cwd > ~/.config/transkit/.env) ---

function loadEnv(): void {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(homedir(), '.config', 'transkit', '.env'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      dotenvConfig({ path: p });
      return;
    }
  }
}

// --- helpers ---

function printUsage(): void {
  console.log(`Usage: f <text> [options]
       echo <text> | f

Options:
  --from <lang>   Source language (en, zh-Hans, zh-Hant). Auto-detected if omitted.
  --to   <lang>   Target language (en, zh-Hans, zh-Hant). Auto-detected if omitted.
  --no-cache      Skip cache lookup and do not cache the result.
  --setup         Interactive setup: save API key and region to ~/.config/transkit/.env
  -v, --verbose   Show detected source and target language.
  -h, --help      Show this help message.

Examples:
  f "Hello, world!"
  f 你好世界
  f "Good morning" --to zh-Hans -v
  echo "早上好" | f
  f --setup
`);
}

async function readStdin(): Promise<string> {
  return new Promise((res) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => res(data.trim()));
    if (process.stdin.isTTY) res('');
  });
}

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((res) => rl.question(question, res));
}

async function runConfig(): Promise<void> {
  const configDir = resolve(homedir(), '.config', 'transkit');
  const configFile = resolve(configDir, '.env');

  // Pre-fill with existing values
  let existing: Record<string, string> = {};
  if (existsSync(configFile)) {
    for (const line of readFileSync(configFile, 'utf8').split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) existing[m[1].trim()] = m[2].trim();
    }
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const currentKey = existing['TRANSLATOR_API_KEY'] ?? '';
  const currentRegion = existing['TRANSLATOR_REGION'] ?? '';
  const currentEndpoint = existing['TRANSLATOR_ENDPOINT'] ?? 'https://api.cognitive.microsofttranslator.com/';

  const hint = (v: string) => v ? ` [${v.slice(0, 6)}...]` : '';

  const apiKey = (await ask(rl, `API Key${hint(currentKey)}: `)).trim() || currentKey;
  const region = (await ask(rl, `Region (e.g. eastasia)${currentRegion ? ` [${currentRegion}]` : ''}: `)).trim() || currentRegion;
  const endpoint = (await ask(rl, `Endpoint [${currentEndpoint}]: `)).trim() || currentEndpoint;

  rl.close();

  if (!apiKey || !region) {
    console.error('API Key and Region are required.');
    process.exit(1);
  }

  if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true });

  writeFileSync(
    configFile,
    `TRANSLATOR_API_KEY=${apiKey}\nTRANSLATOR_REGION=${region}\nTRANSLATOR_ENDPOINT=${endpoint}\n`,
    'utf8',
  );

  console.log(`\nSaved to ${configFile}`);
}

// --- main ---

async function main(): Promise<void> {
  loadEnv();
  const args = process.argv.slice(2);

  if (args[0] === '--setup') {
    await runConfig();
    return;
  }

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  // Parse flags
  let fromLang: string | undefined;
  let toLang: string | undefined;
  let verbose = false;
  let noCache = false;
  const textParts: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--from' && i + 1 < args.length) {
      fromLang = args[++i];
    } else if (args[i] === '--to' && i + 1 < args.length) {
      toLang = args[++i];
    } else if (args[i] === '--verbose' || args[i] === '-v') {
      verbose = true;
    } else if (args[i] === '--no-cache') {
      noCache = true;
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
      'Run `f --setup` to set up your API key, or set TRANSLATOR_API_KEY and TRANSLATOR_REGION\n' +
      'via environment variable, a .env file in the current directory, or ~/.config/transkit/.env',
    );
    process.exit(1);
  }

  const detectedSource = detectLanguage(text);
  const source = (fromLang ?? detectedSource) as Parameters<typeof translate>[1];
  const target = (toLang ?? getTargetLanguage(detectedSource)) as Parameters<typeof translate>[1];

  // Check cache
  if (!noCache) {
    const cached = getCached(text, target, source);
    if (cached) {
      if (verbose) console.error(`[${cached.from} → ${cached.to}] (cached)`);
      console.log(cached.text);
      return;
    }
  }

  try {
    const result = await translate(text, target, config, source);
    if (!noCache) setCached(text, target, result, source);
    if (verbose) console.error(`[${result.from} → ${result.to}]`);
    console.log(result.text);
  } catch (err) {
    console.error(`Translation failed: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
