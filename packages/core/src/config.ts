import { TranslationConfig } from './types.js';

export function loadConfig(): TranslationConfig {
  const apiKey = process.env.TRANSLATOR_API_KEY;
  const endpoint = process.env.TRANSLATOR_ENDPOINT ?? 'https://api.cognitive.microsofttranslator.com/';
  const region = process.env.TRANSLATOR_REGION;

  if (!apiKey) {
    throw new Error('TRANSLATOR_API_KEY environment variable is required');
  }
  if (!region) {
    throw new Error('TRANSLATOR_REGION environment variable is required');
  }

  return { apiKey, endpoint, region };
}
