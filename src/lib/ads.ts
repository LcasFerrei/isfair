/*
 * Anúncios: AdSense na web (computador, navegador do celular e PWA) e, no futuro, AdMob no app nativo
 * (o Google não permite AdSense dentro de app de loja). As telas só usam <AdSlot placement="…" />.
 *
 * Fica desligado até VITE_ADSENSE_CLIENT existir (.env.local / variáveis da Vercel).
 * O ID de publicador e os IDs de bloco são públicos por natureza: aparecem no HTML de qualquer site com AdSense.
 */

/**
 * Lugares onde o app mostra anúncio. Nunca no fluxo de foto, no pagamento ou na edição da carteira:
 * momento de pressa, com dinheiro na mão. Na carteira, só no resumo, abaixo das movimentações.
 */
export type AdPlacement = 'landing' | 'scanner' | 'result' | 'history' | 'wallet' | 'menu';

const env = import.meta.env;

export const ADSENSE_CLIENT: string | undefined = env.VITE_ADSENSE_CLIENT || undefined;

/** Um bloco de anúncio por lugar, criados no painel do AdSense (Anúncios → Por bloco de anúncios) */
const ADSENSE_SLOTS: Record<AdPlacement, string | undefined> = {
  landing: env.VITE_ADSENSE_SLOT_LANDING || undefined,
  scanner: env.VITE_ADSENSE_SLOT_SCANNER || undefined,
  result: env.VITE_ADSENSE_SLOT_RESULT || undefined,
  history: env.VITE_ADSENSE_SLOT_HISTORY || undefined,
  wallet: env.VITE_ADSENSE_SLOT_WALLET || undefined,
  menu: env.VITE_ADSENSE_SLOT_MENU || undefined,
};

export type AdProvider = 'adsense' | 'admob';

/** App de loja empacotado com Capacitor (futuro); fora dele, é web */
export function adProvider(): AdProvider {
  const capacitor = (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return capacitor?.isNativePlatform?.() ? 'admob' : 'adsense';
}

export const adsenseSlot = (placement: AdPlacement) => (ADSENSE_CLIENT ? ADSENSE_SLOTS[placement] : undefined);

let scriptRequested = false;

/** Carrega o script do AdSense uma única vez, só quando o primeiro anúncio aparece. */
export function loadAdSense() {
  if (scriptRequested || !ADSENSE_CLIENT) return;
  scriptRequested = true;
  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  document.head.appendChild(script);
}

/** Pede ao AdSense para preencher o bloco recém-montado. */
export function fillAdSense() {
  const w = window as { adsbygoogle?: unknown[] };
  (w.adsbygoogle = w.adsbygoogle ?? []).push({});
}
