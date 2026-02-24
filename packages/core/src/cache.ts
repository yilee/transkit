import { createHash } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { homedir } from 'os';
import { resolve } from 'path';
import type { TranslationResult } from './types.js';

const CACHE_DIR = resolve(homedir(), '.config', 'transkit');
const CACHE_FILE = resolve(CACHE_DIR, 'cache.json');
const MAX_ENTRIES = 1000;

type CacheStore = Record<string, TranslationResult>;

function cacheKey(text: string, to: string, from?: string): string {
  return createHash('sha1').update(`${from ?? ''}|${to}|${text}`).digest('hex');
}

function readStore(): CacheStore {
  try {
    if (!existsSync(CACHE_FILE)) return {};
    return JSON.parse(readFileSync(CACHE_FILE, 'utf8')) as CacheStore;
  } catch {
    return {};
  }
}

function writeStore(store: CacheStore): void {
  try {
    if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
    // Evict oldest entries when over limit (keep last MAX_ENTRIES keys)
    const keys = Object.keys(store);
    if (keys.length > MAX_ENTRIES) {
      const evict = keys.slice(0, keys.length - MAX_ENTRIES);
      for (const k of evict) delete store[k];
    }
    writeFileSync(CACHE_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch {
    // Cache write failure is non-fatal
  }
}

export function getCached(text: string, to: string, from?: string): TranslationResult | undefined {
  const store = readStore();
  return store[cacheKey(text, to, from)];
}

export function setCached(text: string, to: string, result: TranslationResult, from?: string): void {
  const store = readStore();
  store[cacheKey(text, to, from)] = result;
  writeStore(store);
}
