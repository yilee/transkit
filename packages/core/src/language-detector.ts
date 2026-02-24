import type { SupportedLanguage } from './types.js';

const CHINESE_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}]/u;

export function detectLanguage(text: string): SupportedLanguage {
  if (CHINESE_REGEX.test(text)) {
    return 'zh-Hans';
  }
  return 'en';
}

export function getTargetLanguage(source: SupportedLanguage): SupportedLanguage {
  return source === 'en' ? 'zh-Hans' : 'en';
}
