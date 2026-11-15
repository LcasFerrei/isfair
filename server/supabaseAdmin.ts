import { createHash } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/*
 * Acesso do servidor ao Supabase com a chave service_role (ignora o RLS: fica só no servidor, sem VITE_).
 * Usado pelos relatos (reports.ts) e pelo limite de uso (rateLimit.ts).
 */

export interface ServerEnv {
  SUPABASE_URL?: string;
  VITE_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  /** Sal do hash do IP. Sem ele, usa a própria service_role (também secreta). */
  REPORT_IP_SALT?: string;
}

let cached: { key: string; client: SupabaseClient } | null = null;

export function adminClient(env: ServerEnv): SupabaseClient | null {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (cached?.key !== url + key) {
    cached = { key: url + key, client: createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) };
  }
  return cached.client;
}

/** Código do IP (hash com sal secreto): permite contar pedidos sem guardar o IP */
export function hashIp(ip: string | undefined, env: ServerEnv): string | null {
  if (!ip) return null;
  const salt = env.REPORT_IP_SALT || env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

/** IP de quem chamou, atrás do proxy da Vercel */
export const clientIp = (forwardedFor: string | null | undefined, fallback?: string) =>
  forwardedFor?.split(',')[0]?.trim() || fallback;
