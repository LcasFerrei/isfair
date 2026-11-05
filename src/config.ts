export const APP_VERSION = '1.0.0';

/** Contato para privacidade e suporte (aparece nos Termos e na Política). TROCAR pelo e-mail real antes de publicar. */
export const CONTACT_EMAIL = 'contato@isfair.app';

/** Data da versão atual dos Termos e da Política de privacidade (AAAA-MM-DD) */
export const LEGAL_UPDATED_AT = '2026-10-26';

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
