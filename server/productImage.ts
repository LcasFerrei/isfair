import type { ItemImage } from '../src/types';

/**
 * Open Food Facts: base aberta de produtos embalados (fotos CC BY-SA). Pede um User-Agent identificando o app.
 * O serviço de busca novo é o principal; o antigo (search.pl) fica de reserva porque às vezes responde 503.
 */
const OFF_SEARCH = 'https://search.openfoodfacts.org/search';
const OFF_LEGACY_SEARCH = 'https://world.openfoodfacts.org/cgi/search.pl';
const OFF_PRODUCT_PAGE = 'https://world.openfoodfacts.org/product/';
const USER_AGENT = 'IsFair/1.0 (street price helper for tourists)';
const TIMEOUT_MS = 4000;

const cache = new Map<string, ItemImage | null>();

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Palavras que identificam o produto (ignora "de", "com", números soltos etc.) */
const significantWords = (text: string) =>
  normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !/^\d+$/.test(w));

interface OffProduct {
  code?: string;
  product_name?: string;
  /** Texto no serviço antigo, lista no novo */
  brands?: string | string[];
  image_front_url?: string;
  url?: string;
}

async function searchOff(name: string): Promise<OffProduct[]> {
  const fields = 'code,product_name,brands,image_front_url,url';
  const attempts: URL[] = [new URL(OFF_SEARCH), new URL(OFF_LEGACY_SEARCH)];
  attempts[0].search = new URLSearchParams({ q: name, page_size: '5', fields }).toString();
  attempts[1].search = new URLSearchParams({
    search_terms: name,
    search_simple: '1',
    json: '1',
    page_size: '5',
    fields,
  }).toString();

  for (const url of attempts) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!response.ok) continue;
      const data = (await response.json()) as { hits?: OffProduct[]; products?: OffProduct[] };
      const products = data.hits ?? data.products ?? [];
      if (products.length > 0) return products;
    } catch {
      // tenta a próxima fonte
    }
  }
  return [];
}

/**
 * Procura a foto de um produto embalado pelo nome (ex.: "Club Social Integral").
 * Só aceita um resultado cujo nome/marca contenha a maior parte das palavras pedidas,
 * para não mostrar a foto de outra coisa. Retorna null se não achar ou se demorar.
 */
export async function findPackagedProductImage(name: string): Promise<ItemImage | null> {
  const key = normalize(name).trim();
  if (!key) return null;
  if (cache.has(key)) return cache.get(key)!;

  const words = significantWords(name);
  if (words.length === 0) return null;

  const products = await searchOff(name);
  const match = products.find((p) => {
    if (!p.image_front_url) return false;
    const brands = Array.isArray(p.brands) ? p.brands.join(' ') : (p.brands ?? '');
    const haystack = normalize(`${p.product_name ?? ''} ${brands}`);
    const hits = words.filter((w) => haystack.includes(w)).length;
    return hits / words.length >= 0.6;
  });

  const result: ItemImage | null = match?.image_front_url
    ? {
        url: match.image_front_url,
        sourceUrl: match.url ?? (match.code ? `${OFF_PRODUCT_PAGE}${match.code}` : 'https://world.openfoodfacts.org'),
        source: 'Open Food Facts',
      }
    : null;
  // Sem resultado por falha de rede não fica em cache: tenta de novo na próxima foto
  if (result || products.length > 0) cache.set(key, result);
  return result;
}
