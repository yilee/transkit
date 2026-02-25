import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { resolve } from 'path';
import { tmpdir } from 'os';

const CLI_PATH = resolve(__dirname, '../../dist/index.cjs');
const TEST_DIR = resolve(tmpdir(), `transkit-cli-test-${process.pid}`);
const CONFIG_DIR = resolve(TEST_DIR, '.config', 'transkit');
const CACHE_FILE = resolve(CONFIG_DIR, 'cache.json');

function runCli(args: string[], env?: Record<string, string>): string {
  return execFileSync('node', [CLI_PATH, ...args], {
    encoding: 'utf8',
    env: { ...process.env, HOME: TEST_DIR, ...env },
  });
}

describe('CLI --history', () => {
  beforeEach(() => {
    mkdirSync(CONFIG_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('should show "No translation history found." when cache is empty', () => {
    const output = runCli(['--history']);
    expect(output.trim()).toBe('No translation history found.');
  });

  it('should display translation history from cache', () => {
    const store: Record<string, any> = {
      key1: {
        text: '你好',
        from: 'en',
        to: 'zh-Hans',
        input: 'hello',
        timestamp: 1740000000000,
      },
      key2: {
        text: 'Good morning',
        from: 'zh-Hans',
        to: 'en',
        input: '早上好',
        timestamp: 1740100000000,
      },
    };
    writeFileSync(CACHE_FILE, JSON.stringify(store), 'utf8');

    const output = runCli(['--history']);
    const lines = output.trim().split('\n');

    expect(lines).toHaveLength(2);
    // Newest first (key2 has higher timestamp)
    expect(lines[0]).toContain('早上好');
    expect(lines[0]).toContain('Good morning');
    expect(lines[0]).toContain('zh-Hans → en');
    // Oldest second
    expect(lines[1]).toContain('hello');
    expect(lines[1]).toContain('你好');
    expect(lines[1]).toContain('en → zh-Hans');
  });

  it('should filter out legacy cache entries without input field', () => {
    const store: Record<string, any> = {
      key1: {
        text: '你好',
        from: 'en',
        to: 'zh-Hans',
        input: 'hello',
        timestamp: 1740000000000,
      },
      key2: {
        text: 'legacy',
        from: 'en',
        to: 'zh-Hans',
        // no input or timestamp — legacy entry
      },
    };
    writeFileSync(CACHE_FILE, JSON.stringify(store), 'utf8');

    const output = runCli(['--history']);
    const lines = output.trim().split('\n');

    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('hello');
  });

  it('should show --history in help text', () => {
    try {
      runCli(['--help']);
    } catch (e: any) {
      // --help may exit with 0, execFileSync throws on non-zero
      const output = e.stdout || e.output?.[1]?.toString() || '';
      expect(output).toContain('--history');
      return;
    }
    // If it didn't throw, check the output
    const output = runCli(['--help']);
    expect(output).toContain('--history');
  });
});
