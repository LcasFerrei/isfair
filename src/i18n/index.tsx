import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { FlagCode } from '../components/ui/Flag';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { formatMoney, setFormatLocale } from '../lib/format';
import type { ChangePiece, City, CurrencyCode, Denomination, Product } from '../types';
import * as ar from './locales/ar';
import * as en from './locales/en';
import * as es from './locales/es';
import * as fr from './locales/fr';
import * as it from './locales/it';
import * as ja from './locales/ja';
import * as pt from './locales/pt';
import * as zh from './locales/zh';
import type { UiDict, UiKey } from './locales/pt';
import type { Content, CuratedCityId, Lang, NoteValue, ProductId } from './types';

export type { Lang, UiKey };

export interface LanguageInfo {
  code: Lang;
  /** Nome no próprio idioma */
  name: string;
  flag: FlagCode;
  dir: 'ltr' | 'rtl';
  /** Locale para Intl (números com algarismos latinos também em árabe, como nos preços de rua) */
  intl: string;
  /** Código aceito pelas APIs de mapa e pelo Gemini */
  api: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'pt-BR', name: 'Português', flag: 'BR', dir: 'ltr', intl: 'pt-BR', api: 'pt' },
  { code: 'en', name: 'English', flag: 'US', dir: 'ltr', intl: 'en-US', api: 'en' },
  { code: 'es', name: 'Español', flag: 'ES', dir: 'ltr', intl: 'es-ES', api: 'es' },
  { code: 'fr', name: 'Français', flag: 'FR', dir: 'ltr', intl: 'fr-FR', api: 'fr' },
  { code: 'it', name: 'Italiano', flag: 'IT', dir: 'ltr', intl: 'it-IT', api: 'it' },
  { code: 'ar', name: 'العربية', flag: 'SA', dir: 'rtl', intl: 'ar-u-nu-latn', api: 'ar' },
  { code: 'zh', name: '中文（简体）', flag: 'CN', dir: 'ltr', intl: 'zh-CN', api: 'zh' },
  { code: 'ja', name: '日本語', flag: 'JP', dir: 'ltr', intl: 'ja-JP', api: 'ja' },
];

const LOCALES: Record<Lang, { ui: UiDict; content: Content }> = {
  'pt-BR': pt,
  en,
  es,
  fr,
  it,
  ar,
  zh,
  ja,
};

type Vars = Record<string, string | number>;

/** Chaves com plural: 'result.communityStats' → result.communityStats_one / _other */
type PluralBase = { [K in UiKey]: K extends `${infer Base}_other` ? Base : never }[UiKey];

/** Escolhe o idioma do aparelho se for suportado; senão inglês (o app é para turistas). */
export function detectLanguage(): Lang {
  for (const tag of navigator.languages ?? [navigator.language]) {
    const base = tag.toLowerCase().split('-')[0];
    if (base === 'pt') return 'pt-BR';
    const match = LANGUAGES.find((l) => l.code === base);
    if (match) return match.code;
  }
  return 'en';
}

const interpolate = (text: string, vars?: Vars) =>
  vars ? text.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`)) : text;

function createI18n(lang: Lang, setLang: (lang: Lang) => void) {
  const info = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
  const { ui, content } = LOCALES[lang];
  const plural = new Intl.PluralRules(info.intl);

  const t = (key: UiKey, vars?: Vars) => interpolate(ui[key], vars);
  const tp = (base: PluralBase, count: number, vars?: Vars) => {
    const category = plural.select(count);
    const key = (category === 'one' ? `${base}_one` : `${base}_other`) as UiKey;
    return interpolate(ui[key], { count, ...vars });
  };

  const productText = (p: Product) => content.products[p.id as ProductId] ?? pt.content.products[p.id as ProductId];

  return {
    lang,
    setLang,
    info,
    dir: info.dir,
    t,
    tp,
    productName: (p: Product) => productText(p).name,
    productShort: (p: Product) => productText(p).short,
    productUnit: (p: Product) => productText(p).unit,
    productTip: (p: Product, index: number) => {
      const tips = productText(p).tips;
      return tips[index % tips.length];
    },
    cityArea: (city: City) => (city.curated ? city.area : t('city.estimatedArea')),
    cityTip: (city: City) => {
      if (city.curated) return content.cityTips[city.id as CuratedCityId] ?? city.tip;
      return city.countryCode === 'BR'
        ? t('city.estimatedTipBR', { city: city.name, region: city.state })
        : t('city.estimatedTipWorld', { country: city.country });
    },
    currencyName: (code: CurrencyCode) => content.currencies[code],
    animalName: (value: number) => content.animals[value as NoteValue] ?? '',
    /** Legenda da cédula: animal (real, traduzido), retrato (dólar) ou nada (euro) */
    noteLabel: (denom: Denomination) =>
      !denom.currency || denom.currency === 'BRL' ? (content.animals[denom.value as NoteValue] ?? '') : denom.label,
    describePieces: (pieces: ChangePiece[]) =>
      pieces
        .map(({ denom, count }) =>
          tp(denom.kind === 'note' ? 'money.note' : 'money.coin', count, { value: formatMoney(denom.value, denom.currency) }),
        )
        .join(t('money.and')),
  };
}

export type I18n = ReturnType<typeof createI18n>;

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [stored, setLang] = useLocalStorage<Lang>('isfair:lang', detectLanguage());
  const lang = LOCALES[stored] ? stored : 'en';
  const value = useMemo(() => createI18n(lang, setLang), [lang, setLang]);

  // Antes de renderizar os filhos: os formatadores de número/data usam o locale atual
  setFormatLocale(value.info.intl);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = value.dir;
  }, [lang, value.dir]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n precisa estar dentro de <I18nProvider>');
  return ctx;
}
