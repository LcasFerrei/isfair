import { adminClient, hashIp, type ServerEnv } from './supabaseAdmin';

/*
 * Limite de uso das rotas que gastam a cota do Gemini (tabela `api_calls`, ver supabase/rate_limits.sql).
 * Sem Supabase configurado ou se o banco falhar, deixa passar: o limite protege a cota, não pode derrubar o app.
 */

export type LimitedRoute = 'identify' | 'estimate';

export interface RateLimitEnv extends ServerEnv {
  /** Teto de chamadas ao Gemini por dia, somando todo mundo (opcional). Ex.: 900 no plano grátis. */
  GEMINI_DAILY_LIMIT?: string;
}

/** Máximo por IP por hora. Uma foto chama identify; uma busca por texto chama estimate. */
const PER_IP_PER_HOUR: Record<LimitedRoute, number> = { identify: 30, estimate: 60 };

const tooMany = { status: 429, body: { code: 'rateLimit', error: 'Muitos pedidos. Tente de novo mais tarde.' } };

/** Devolve a resposta 429 se passou do limite; null se pode seguir (e já conta este pedido). */
export async function checkRateLimit(route: LimitedRoute, ip: string | undefined, env: RateLimitEnv) {
  const db = adminClient(env);
  const ipHash = hashIp(ip, env);
  if (!db || !ipHash) return null;
  try {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const dailyLimit = Number(env.GEMINI_DAILY_LIMIT) || 0;
    const [perIp, perDay] = await Promise.all([
      db.from('api_calls').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).eq('route', route).gte('created_at', hourAgo),
      dailyLimit
        ? db.from('api_calls').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        : Promise.resolve(null),
    ]);
    if (perIp.error) throw perIp.error;
    if ((perIp.count ?? 0) >= PER_IP_PER_HOUR[route]) return tooMany;
    if (perDay && (perDay.count ?? 0) >= dailyLimit) return tooMany;
    const { error } = await db.from('api_calls').insert({ route, ip_hash: ipHash });
    if (error) throw error;
  } catch (error) {
    console.warn('[rateLimit] sem limite neste pedido:', (error as Error).message ?? error);
  }
  return null;
}
