/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Projeto Supabase (Project Settings → API) */
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** "true" depois de configurar o Google em Authentication → Providers */
  readonly VITE_AUTH_GOOGLE?: string;
  /** ID de publicador do AdSense, ex.: ca-pub-1234567890123456 */
  readonly VITE_ADSENSE_CLIENT?: string;
  /** IDs dos blocos de anúncio de cada lugar do app */
  readonly VITE_ADSENSE_SLOT_LANDING?: string;
  readonly VITE_ADSENSE_SLOT_RESULT?: string;
  readonly VITE_ADSENSE_SLOT_HISTORY?: string;
  readonly VITE_ADSENSE_SLOT_SCANNER?: string;
  readonly VITE_ADSENSE_SLOT_WALLET?: string;
  readonly VITE_ADSENSE_SLOT_MENU?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
