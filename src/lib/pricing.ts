import type { City, CommunityStats, PriceRange, Product, VerdictLevel } from '../types';

/** Cores do semáforo; os textos ficam nas traduções (verdict.<nível>, verdict.<nível>.short). */
export interface VerdictMeta {
  /** Cor de preenchimento */
  color: string;
  /** Variante escura para texto sobre fundo branco */
  text: string;
}

export const VERDICT_META: Record<VerdictLevel, VerdictMeta> = {
  fair: { color: '#00C48C', text: '#00875F' },
  tourist: { color: '#FFB800', text: '#9A6B00' },
  abusive: { color: '#FF4D4D', text: '#D63030' },
};

export function getPriceRange(product: Product, city: City): PriceRange {
  const f = city.priceFactor;
  const fairMin = Math.max(1, Math.round(product.baseRange.fairMin * f));
  const fairMax = Math.max(fairMin + 1, Math.round(product.baseRange.fairMax * f));
  const touristMax = Math.max(fairMax + 1, Math.round(product.baseRange.touristMax * f));
  return { fairMin, fairMax, touristMax };
}

export function getVerdict(price: number, range: PriceRange): VerdictLevel {
  if (price <= range.fairMax) return 'fair';
  if (price <= range.touristMax) return 'tourist';
  return 'abusive';
}

export const examplePrice = (product: Product, city: City) => Math.round(product.samplePrice * city.priceFactor);

/** Índice de uma das dicas do produto; o texto é traduzido na exibição. */
export const pickTipIndex = (product: Product, seed: number) => seed % product.tips.length;

export const communityKey = (productId: string, cityId: string) => `${productId}:${cityId}`;

function hash(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Estatísticas iniciais simuladas (e determinísticas) da comunidade para cada produto/cidade.
 * Cidades sem dados locais começam sem relatos, para não inventar uma comunidade que não existe.
 */
export function initialCommunityStats(product: Product, city: City): CommunityStats {
  const range = getPriceRange(product, city);
  const mid = (range.fairMin + range.fairMax) / 2;
  if (!city.curated) return { reports: 0, avgPaid: mid };
  const seed = hash(product.id + city.id);
  const avg = mid * (1 + (seed % 15) / 100);
  return { reports: 37 + (seed % 260), avgPaid: Math.round(avg * 2) / 2 };
}
