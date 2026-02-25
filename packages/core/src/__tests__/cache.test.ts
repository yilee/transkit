import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { tmpdir } from 'os';

// Use vi.hoisted so the test dir is available inside the mock factory
const { TEST_DIR } = vi.hoisted(() => {
  const { tmpdir } = require('os');
  const { resolve } = require('path');
  return { TEST_DIR: resolve(tmpdir(), `transkit-test-${process.pid}`) };
});

// Mock the homedir to redirect cache to temp directory
vi.mock('os', async () => {
  const actual = await vi.importActual<typeof import('os')>('os');
  return {
    ...actual,
    homedir: () => resolve(TEST_DIR, 'fakehome'),
  };
});

import { getCached, setCached, getHistory } from '../cache.js';
import type { TranslationResult } from '../types.js';

const CACHE_DIR = resolve(TEST_DIR, 'fakehome', '.config', 'transkit');
const CACHE_FILE = resolve(CACHE_DIR, 'cache.json');

describe('cache', () => {
  beforeEach(() => {
    mkdirSync(CACHE_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('setCached', () => {
    it('should store input text and timestamp alongside translation result', () => {
      const result: TranslationResult = { text: '你好', from: 'en', to: 'zh-Hans' };
      setCached('hello', 'zh-Hans', result, 'en');

      const store = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
      const entries = Object.values(store) as any[];
      expect(entries).toHaveLength(1);
      expect(entries[0].input).toBe('hello');
      expect(entries[0].text).toBe('你好');
      expect(entries[0].from).toBe('en');
      expect(entries[0].to).toBe('zh-Hans');
      expect(typeof entries[0].timestamp).toBe('number');
      expect(entries[0].timestamp).toBeGreaterThan(0);
    });
  });

  describe('getCached', () => {
    it('should return cached translation result', () => {
      const result: TranslationResult = { text: '你好', from: 'en', to: 'zh-Hans' };
      setCached('hello', 'zh-Hans', result, 'en');

      const cached = getCached('hello', 'zh-Hans', 'en');
      expect(cached).toBeDefined();
      expect(cached!.text).toBe('你好');
      expect(cached!.from).toBe('en');
      expect(cached!.to).toBe('zh-Hans');
    });

    it('should return undefined for uncached text', () => {
      const cached = getCached('unknown', 'zh-Hans', 'en');
      expect(cached).toBeUndefined();
    });
  });

  describe('getHistory', () => {
    it('should return empty array when no cache exists', () => {
      // Remove cache file if it exists
      if (existsSync(CACHE_FILE)) rmSync(CACHE_FILE);

      const history = getHistory();
      expect(history).toEqual([]);
    });

    it('should return entries sorted newest first', () => {
      // Write cache with known timestamps
      const store: Record<string, any> = {
        key1: { text: '你好', from: 'en', to: 'zh-Hans', input: 'hello', timestamp: 1000 },
        key2: { text: 'world', from: 'zh-Hans', to: 'en', input: '世界', timestamp: 3000 },
        key3: { text: 'good', from: 'zh-Hans', to: 'en', input: '好', timestamp: 2000 },
      };
      writeFileSync(CACHE_FILE, JSON.stringify(store), 'utf8');

      const history = getHistory();
      expect(history).toHaveLength(3);
      expect(history[0].input).toBe('世界');
      expect(history[0].timestamp).toBe(3000);
      expect(history[1].input).toBe('好');
      expect(history[1].timestamp).toBe(2000);
      expect(history[2].input).toBe('hello');
      expect(history[2].timestamp).toBe(1000);
    });

    it('should filter out entries without input field (legacy entries)', () => {
      const store: Record<string, any> = {
        key1: { text: '你好', from: 'en', to: 'zh-Hans', input: 'hello', timestamp: 1000 },
        key2: { text: 'world', from: 'zh-Hans', to: 'en' }, // legacy entry without input
      };
      writeFileSync(CACHE_FILE, JSON.stringify(store), 'utf8');

      const history = getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].input).toBe('hello');
    });

    it('should return entries with all required fields', () => {
      const result: TranslationResult = { text: '你好世界', from: 'en', to: 'zh-Hans' };
      setCached('hello world', 'zh-Hans', result, 'en');

      const history = getHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        text: '你好世界',
        from: 'en',
        to: 'zh-Hans',
        input: 'hello world',
      });
      expect(history[0].timestamp).toBeDefined();
    });
  });
});
