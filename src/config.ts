export const APP_VERSION = '1.0.0';

/** Contato para privacidade e suporte (aparece nos Termos e na Política). TROCAR pelo e-mail real antes de publicar. */
export const CONTACT_EMAIL = 'contato@isfair.app';

/**
 * Relatos da comunidade compartilhados entre usuários (tabela `reports` no Supabase, ver supabase/reports.sql).
 * Desligado, os relatos ficam só no histórico do aparelho e o app não mostra "média da comunidade"
 * nem promete ajudar outros turistas. Liga com VITE_COMMUNITY=true.
 */
export const COMMUNITY_SHARED = import.meta.env.VITE_COMMUNITY === 'true';

/** Data da versão atual dos Termos e da Política de privacidade (AAAA-MM-DD) */
export const LEGAL_UPDATED_AT = '2026-11-15';

/** Todas as chaves que o app grava no navegador começam com este prefixo. */
export const STORAGE_PREFIX = 'isfair:';

/** Apaga todos os dados do IsFair deste aparelho. */
export function clearAppStorage() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(STORAGE_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // storage indisponível: não há o que apagar
  }
}
