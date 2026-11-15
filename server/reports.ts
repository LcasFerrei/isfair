import { adminClient, hashIp, type ServerEnv } from './supabaseAdmin';
import { MIN_REPORTS } from '../src/lib/communityConfig';
import type { CommunityStats } from '../src/types';

/*
 * Relatos da comunidade (tabela `reports`, ver supabase/reports.sql).
 * Usado pelas funções da Vercel (api/report.ts, api/community.ts) e pelo `npm run dev` (vite.config.ts).
 * Precisa de SUPABASE_SERVICE_ROLE_KEY: essa chave ignora o RLS, então fica só no servidor (sem VITE_).
 */

export type ReportsEnv = ServerEnv;

type Result = { status: number; body: unknown };

/** Relatos mais antigos que isso não entram na média (preços mudam com a inflação) */
const WINDOW_MONTHS = 12;
/** Máximo de relatos por IP por hora */
const MAX_PER_HOUR = 30;
/** Valores fora de [mediana ÷ 3, mediana × 3] são descartados como erro ou trote */
const OUTLIER_FACTOR = 3;

const unavailable: Result = { status: 503, body: { code: 'unavailable' } };
const badRequest: Result = { status: 400, body: { code: 'badRequest' } };

const isText = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const isCurrency = (value: unknown): value is string => typeof value === 'string' && /^[A-Z]{3}$/.test(value);

/** Mesma normalização para quem grava e quem lê: "Club Social " e "club social" contam juntos */
const normalizeKey = (key: string) => key.trim().toLowerCase().replace(/\s+/g, ' ');

const monthsAgo = (months: number) => {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString();
};

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** POST /api/community — mediana do que os turistas pagaram por um item numa cidade, nos últimos 12 meses */
export async function communityStats(body: unknown, env: ReportsEnv): Promise<Result> {
  const db = adminClient(env);
  if (!db) return unavailable;
  const { productKey, cityId, currency } = (body ?? {}) as Record<string, unknown>;
  if (!isText(productKey, 100) || !isText(cityId, 160) || !isCurrency(currency)) return badRequest;

  const { data, error } = await db
    .from('reports')
    .select('paid, trip_month')
    .eq('product_key', normalizeKey(productKey))
    .eq('city_id', cityId)
    .eq('currency', currency)
    .gte('created_at', monthsAgo(WINDOW_MONTHS))
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) {
    console.error('[community]', error.message);
    return { status: 502, body: { code: 'failed' } };
  }

  const all = (data ?? []).map((r) => Number(r.paid)).filter((n) => n > 0).sort((a, b) => a - b);
  const rough = all.length ? median(all) : 0;
  const kept = all.filter((n) => n >= rough / OUTLIER_FACTOR && n <= rough * OUTLIER_FACTOR);
  const months = (data ?? []).map((r) => String(r.trip_month).slice(0, 7)).sort();

  const stats: CommunityStats = {
    reports: kept.length,
    median: kept.length >= MIN_REPORTS ? Math.round(median(kept) * 100) / 100 : null,
    fromMonth: months[0] ?? null,
    toMonth: months[months.length - 1] ?? null,
  };
  return { status: 200, body: stats };
}

/** POST /api/report — grava quanto o turista pagou */
export async function submitReport(body: unknown, ip: string | undefined, env: ReportsEnv): Promise<Result> {
  const db = adminClient(env);
  if (!db) return unavailable;
  const { productKey, cityId, currency, paid, origin, accessToken } = (body ?? {}) as Record<string, unknown>;
  if (!isText(productKey, 100) || !isText(cityId, 160) || !isCurrency(currency)) return badRequest;
  if (typeof paid !== 'number' || !Number.isFinite(paid) || paid <= 0 || paid > 1e9) return badRequest;
  const originCode = typeof origin === 'string' && /^[A-Z]{2}$/.test(origin) ? origin : null;

  // Conta é opcional; um token inválido só faz o relato ir sem conta
  let userId: string | null = null;
  if (typeof accessToken === 'string' && accessToken.length < 4000) {
    const { data } = await db.auth.getUser(accessToken);
    userId = data.user?.id ?? null;
  }

  const ipHash = hashIp(ip, env);
  const key = normalizeKey(productKey);

  if (ipHash) {
    const { count } = await db
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
    if ((count ?? 0) >= MAX_PER_HOUR) return { status: 429, body: { code: 'rateLimit' } };
  }

  // Um relato por pessoa (conta ou IP), item e cidade a cada 24 h: o segundo é aceito, mas não conta de novo
  const who = userId ? { column: 'user_id', value: userId } : ipHash ? { column: 'ip_hash', value: ipHash } : null;
  if (who) {
    const { count } = await db
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq(who.column, who.value)
      .eq('product_key', key)
      .eq('city_id', cityId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    if ((count ?? 0) > 0) return { status: 200, body: { ok: true, duplicate: true } };
  }

  const { error } = await db.from('reports').insert({
    product_key: key,
    city_id: cityId,
    currency,
    paid: Math.round(paid * 100) / 100,
    origin: originCode,
    user_id: userId,
    ip_hash: ipHash,
  });
  if (error) {
    console.error('[report]', error.message);
    return { status: 502, body: { code: 'failed' } };
  }
  return { status: 201, body: { ok: true } };
}

