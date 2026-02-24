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

export type SupportedLanguage = 'zh-Hans' | 'zh-Hant' | 'en';
