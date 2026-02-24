import fetch from 'node-fetch';
import type { TranslationConfig, TranslationResult, SupportedLanguage } from './types.js';

interface MsTranslatorResponseItem {
  translations: Array<{ text: string; to: string }>;
  detectedLanguage?: { language: string; score: number };
}

export async function translate(
  text: string,
  to: SupportedLanguage,
  config: TranslationConfig,
  from?: SupportedLanguage,
): Promise<TranslationResult> {
  const url = new URL('/translate', config.endpoint);
  url.searchParams.set('api-version', '3.0');
  url.searchParams.set('to', to);
  if (from) {
    url.searchParams.set('from', from);
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': config.apiKey,
      'Ocp-Apim-Subscription-Region': config.region,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([{ Text: text }]),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Translation API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as MsTranslatorResponseItem[];
  const item = data[0];
  const detectedFrom = item.detectedLanguage?.language ?? from ?? 'unknown';

  return {
    text: item.translations[0].text,
    from: detectedFrom,
    to,
  };
}
