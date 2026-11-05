import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/*
 * Supabase: contas reais (cadastro, login, confirmação de e-mail e recuperação de senha).
 * A URL e a chave "anon" são públicas por natureza: quem protege os dados são as regras do Supabase (RLS).
 * Sem as duas variáveis, o app usa as contas provisórias deste aparelho (auth/AuthContext.tsx).
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // Lê o login que volta na URL dos e-mails de confirmação e de nova senha
          detectSessionInUrl: true,
          // Fluxo "implicit": o link do e-mail funciona mesmo aberto em outro navegador ou aparelho
          flowType: 'implicit',
          storageKey: 'isfair:supabase-auth',
        },
      })
    : null;

/** Login com Google ligado no painel do Supabase (Authentication → Providers → Google) */
export const GOOGLE_AUTH_ENABLED = Boolean(supabase) && import.meta.env.VITE_AUTH_GOOGLE === 'true';
