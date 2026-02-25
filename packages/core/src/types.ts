export interface TranslationConfig {
  apiKey: string;
  endpoint: string;
  region: string;
}

export interface TranslationResult {
  text: string;
  from: string;
  to: string;
}

export interface CacheEntry extends TranslationResult {
  input: string;
  timestamp: number;
}

export type SupportedLanguage = 'zh-Hans' | 'zh-Hant' | 'en';
