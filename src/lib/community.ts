import { useEffect, useState } from 'react';
import { COMMUNITY_SHARED } from '../config';
import { CUSTOM_PRODUCT_ID } from '../data/mockData';
import { supabase } from './supabase';
import type { CommunityStats, Consultation } from '../types';

/** Relatos guardados por 10 min na memória: voltar ao mesmo resultado não pede de novo */
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; stats: CommunityStats }>();

/**
 * Chave do item nos relatos: o produto do catálogo ("coco") ou, fora dele, o nome lido pela IA.
 * null quando não há como agrupar (item sem nome).
 */
export function reportKeyOf(c: Consultation): string | null {
  if (c.productId !== CUSTOM_PRODUCT_ID) return c.productId;
  const name = (c.item?.name ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  return name ? `custom:${name}`.slice(0, 100) : null;
}

const requestOf = (c: Consultation, key: string) => ({ productKey: key, cityId: c.cityId, currency: c.currency ?? 'BRL' });
const cacheKeyOf = (c: Consultation, key: string) => `${key}|${c.cityId}|${c.currency ?? 'BRL'}`;

async function fetchStats(c: Consultation, key: string, signal: AbortSignal): Promise<CommunityStats | null> {
  const id = cacheKeyOf(c, key);
  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.stats;
  const response = await fetch('/api/community', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestOf(c, key)),
    signal,
  });
  if (!response.ok) return null;
  const stats = (await response.json()) as CommunityStats;
  cache.set(id, { at: Date.now(), stats });
  return stats;
}

/**
 * Relatos da comunidade para o resultado. undefined enquanto carrega; null se indisponível
 * (comunidade desligada, servidor sem Supabase ou sem internet): aí a tela simplesmente não mostra.
 */
export function useCommunityStats(c: Consultation, refresh: unknown): CommunityStats | null | undefined {
  const key = COMMUNITY_SHARED ? reportKeyOf(c) : null;
  const [stats, setStats] = useState<CommunityStats | null | undefined>(key ? undefined : null);

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    fetchStats(c, key, controller.signal)
      .then(setStats)
      .catch(() => {
        if (!controller.signal.aborted) setStats(null);
      });
    return () => controller.abort();
  }, [key, c.cityId, c.currency, refresh]);

  return stats;
}

/**
 * Envia quanto a pessoa pagou. Não bloqueia a tela: se falhar, o valor continua no histórico do aparelho.
 * `origin`: de onde o turista é (ISO 3166-1 alfa-2 ou "EU"), só se a pessoa deixar.
 */
export async function sendReport(c: Consultation, paid: number, origin: string | null): Promise<boolean> {
  const key = reportKeyOf(c);
  if (!COMMUNITY_SHARED || !key) return false;
  try {
    const session = supabase ? (await supabase.auth.getSession()).data.session : null;
    const response = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...requestOf(c, key), paid, origin, accessToken: session?.access_token }),
    });
    cache.delete(cacheKeyOf(c, key));
    return response.ok;
  } catch {
    return false;
  }
}
