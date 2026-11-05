import type { City, CityContext, PriceEstimate } from '../types';

const CACHE_KEY = 'isfair:estimates';
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 200;

type CacheEntry = { at: number; estimate: PriceEstimate };

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export const cityContext = (city: City): CityContext => ({
  name: city.name,
  state: city.state,
  country: city.country,
  currency: city.currency,
});

/** A mesma estimativa serve para o mesmo item, cidade e idioma (os textos vêm no idioma do turista). */
const keyOf = (item: string, city: City, language: string) => `${language}|${city.id}|${normalize(item)}`;

function readCache(): Record<string, CacheEntry> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') as Record<string, CacheEntry>;
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, CacheEntry>) {
  try {
    const entries = Object.entries(cache)
      .sort(([, a], [, b]) => b.at - a.at)
      .slice(0, MAX_ENTRIES);
    localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // sem storage: só não guarda
  }
}

export function getCachedEstimate(item: string, city: City, language: string): PriceEstimate | null {
  const entry = readCache()[keyOf(item, city, language)];
  return entry && Date.now() - entry.at < TTL_MS ? entry.estimate : null;
}

/** Guarda uma estimativa recebida junto com a identificação da foto, para não pedir de novo. */
export function cacheEstimate(item: string, city: City, language: string, estimate: PriceEstimate) {
  const cache = readCache();
  cache[keyOf(item, city, language)] = { at: Date.now(), estimate };
  writeCache(cache);
}

/** Pede à IA o preço justo do item na cidade (com cache de 7 dias). Lança Error em caso de falha. */
export async function requestEstimate(item: string, city: City, language: string, signal?: AbortSignal): Promise<PriceEstimate> {
  const cached = getCachedEstimate(item, city, language);
  if (cached) return cached;

  const response = await fetch('/api/estimate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item, city: cityContext(city), language }),
    signal,
  });
  const data = (await response.json().catch(() => null)) as (PriceEstimate & { code?: string }) | null;
  if (!response.ok || !data?.range) throw new Error(data?.code ?? 'failed');
  cacheEstimate(item, city, language, data);
  return data;
}
