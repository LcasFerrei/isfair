import type { FlagCode } from '../components/ui/Flag';

export type ProductCategory = 'food' | 'drinks' | 'beach' | 'souvenirs';

export type CurrencyCode =
  | 'BRL' | 'USD' | 'EUR' | 'GBP' | 'ARS' | 'CLP' | 'UYU' | 'PYG' | 'BOB' | 'PEN' | 'COP'
  | 'CAD' | 'MXN' | 'CHF' | 'AUD' | 'CNY' | 'JPY' | 'KRW' | 'INR' | 'ILS';
/** Moedas locais com cédulas e moedas desenhadas (carteira e troco): hoje, todas as do app */
export type WalletCurrency = CurrencyCode;
export type VerdictLevel = 'fair' | 'tourist' | 'abusive';
export type Tab = 'scanner' | 'result' | 'cash' | 'history' | 'settings' | 'notifications';

/**
 * Avisos gerados pelo próprio app (sem servidor). Guardamos o tipo e os dados, não o texto,
 * para a notificação acompanhar a troca de idioma.
 */
export type AppNotification = { id: string; createdAt: number; read: boolean } & (
  | { kind: 'welcome' }
  | { kind: 'city'; city: string; currency: string }
  | { kind: 'fx'; home: string; local: string; pct: number }
  | { kind: 'payment'; currency: string; paidCents: number; changeCents: number }
  | { kind: 'gringoTax'; consultationId: string; productId: string; itemName?: string; overAmount: number; currency: string; city: string }
);

export type NotificationKind = AppNotification['kind'];

/** Quais avisos o turista quer receber; `device` = também como notificação do sistema */
export interface NotificationPrefs {
  city: boolean;
  fx: boolean;
  payment: boolean;
  gringoTax: boolean;
  device: boolean;
}

export interface City {
  /** Cidades com dados locais: slug ("rio"); demais: "geo:<país>:<estado>:<cidade>" */
  id: string;
  name: string;
  /** Sigla do estado no Brasil; estado/província por extenso fora dele */
  state: string;
  country: string;
  /** ISO 3166-1 alfa-2, ex.: "BR" */
  countryCode: string;
  /** Moeda local (ISO 4217), ex.: "BRL", "USD", "EUR", "JPY" */
  currency: string;
  /** Bairros/regiões de referência usados nas faixas de preço */
  area: string;
  /** Multiplicador aplicado sobre a faixa base (Rio de Janeiro = 1) */
  priceFactor: number;
  /** Centro da cidade [latitude, longitude] */
  coords: [number, number];
  tip: string;
  /** true = faixas e dicas próprias; false = estimativa por estado/país */
  curated: boolean;
}

export interface Currency {
  code: CurrencyCode;
  name: string;
  /** Código da bandeira (ISO alfa-2; EU para o euro) */
  flag: FlagCode;
  /** Seção na lista de moedas */
  group: 'popular' | 'southAmerica' | 'northAmerica' | 'europe' | 'asiaOceania';
  /** Quantos reais (BRL) valem 1 unidade desta moeda, usado se a cotação do dia não carregar */
  baseRate: number;
  /** Países (ISO alfa-2) que usam a moeda */
  countries: string[];
}

export interface PriceRange {
  fairMin: number;
  fairMax: number;
  touristMax: number;
}

export interface Product {
  id: string;
  emoji: string;
  name: string;
  /** Nome curto para os atalhos da Home */
  shortName: string;
  nameEn: string;
  unit: string;
  /** Aba do "Teste rápido" */
  category: ProductCategory;
  /** Aparece na aba "Populares" do Teste rápido */
  quick: boolean;
  /** Vendido também fora do Brasil (aparece no Teste rápido de qualquer país) */
  global?: boolean;
  /** Preço de exemplo "pedido pelo ambulante" (base Rio) */
  samplePrice: number;
  baseRange: PriceRange;
  tips: string[];
}

export interface CommunityStats {
  reports: number;
  avgPaid: number;
}

export interface Consultation {
  id: string;
  productId: string;
  cityId: string;
  /** Cópia da cidade no momento da consulta (ausente em consultas antigas) */
  city?: City;
  /** Item exato da foto (ex.: "Club Social Integral"), quando a consulta veio de uma foto */
  item?: DetectedItem;
  /** Textos da IA quando a faixa de preço foi estimada por ela */
  ai?: { unit: string; explanation: string; tip: string };
  /** Valores (preço e faixa) estão nesta moeda; consultas antigas são em reais */
  currency?: string;
  price: number;
  verdict: VerdictLevel;
  range: PriceRange;
  /** Índice da dica do produto (traduzida na hora de exibir) */
  tipIndex?: number;
  /** Texto da dica em consultas antigas, de antes da tradução */
  tip?: string;
  createdAt: number;
  paidReported?: number;
}

/** bimetal: anel dourado e miolo prateado (R$ 1, € 2); bimetalInverse: o contrário (€ 1) */
export type CoinMetal = 'silver' | 'gold' | 'copper' | 'bimetal' | 'bimetalInverse';

export interface Denomination {
  value: number;
  kind: 'note' | 'coin';
  label: string;
  /** Valor por extenso impresso na peça */
  words: string;
  /** Dimensões reais em mm: cédula [largura, altura]; moeda [diâmetro, diâmetro] */
  size: [number, number];
  emoji?: string;
  /** Cédulas: cor do papel e da tinta */
  paper?: string;
  ink?: string;
  /** Cédulas: texto do emissor impresso no topo */
  issuer?: string;
  /** Moeda da peça (definida em data/money.ts) */
  currency?: WalletCurrency;
  /** Moedas */
  metal?: CoinMetal;
}

export interface ChangePiece {
  denom: Denomination;
  count: number;
}

/** Valor da cédula/moeda (na moeda da carteira) → quantidade */
export type Wallet = Record<number, number>;

export interface WalletTx {
  id: string;
  type: 'payment' | 'adjust';
  createdAt: number;
  /** Moeda da carteira; movimentações antigas são em reais */
  currency?: WalletCurrency;
  productId?: string;
  itemName?: string;
  /** Rótulo em movimentações antigas, de antes da tradução */
  label?: string;
  totalCents?: number;
  paidCents?: number;
  changeCents?: number;
  /** Variação do saldo da carteira */
  deltaCents: number;
}

/** Corpo enviado para /api/identify */
export interface IdentifyRequest {
  /** Imagem em base64, sem o prefixo data: */
  image: string;
  mimeType: string;
  /** Idioma da descrição (código curto: pt, en, es, fr, it, ar, zh, ja) */
  language?: string;
  /** Cidade atual: a IA já devolve a estimativa de preço na mesma chamada */
  city?: CityContext;
}

/** Cidade enviada para a IA estimar preços */
export interface CityContext {
  name: string;
  state: string;
  country: string;
  /** Moeda local em que a IA deve estimar (ISO 4217) */
  currency: string;
}

/** Faixa de preço estimada pela IA para um item numa cidade */
export interface PriceEstimate {
  range: PriceRange;
  /** Unidade a que o preço se refere, no idioma pedido */
  unit: string;
  /** 0 a 1 */
  confidence: number;
  explanation: string;
  tip: string;
}

/** Corpo enviado para /api/estimate */
export interface EstimateRequest {
  item: string;
  city: CityContext;
  language?: string;
}

export interface ItemImage {
  url: string;
  /** Página da fonte (crédito da foto) */
  sourceUrl: string;
  source: string;
}

/** O item exato que a IA viu na foto, guardado junto com a consulta */
export interface DetectedItem {
  name: string;
  image: ItemImage | null;
}

export type IdentifyErrorCode = 'unavailable' | 'badImage' | 'rateLimit' | 'failed';

/** Resposta de /api/identify */
export interface IdentifyResponse {
  /** id de um produto do catálogo, ou null se a IA não reconheceu nenhum */
  productId: string | null;
  /** 0 a 1 */
  confidence: number;
  /** Preço na moeda local lido na foto (etiqueta, placa, cardápio), se houver */
  priceSeen: number | null;
  /** Nome específico do que aparece na foto (ex.: "Club Social Integral"), mesmo fora do catálogo */
  itemName: string | null;
  /** Foto oficial do item encontrada na internet (só para produtos embalados com marca) */
  itemImage: ItemImage | null;
  /** Preço justo estimado pela IA para esse item na cidade, se conseguiu estimar */
  estimate: PriceEstimate | null;
  /** O que a IA vê na foto, em português */
  description: string;
}

export interface FxContext {
  /** Moeda de casa do turista */
  code: CurrencyCode;
  /** Moeda local (da cidade atual) */
  local: string;
  /** Reais por 1 unidade de cada moeda, para converter entre quaisquer duas */
  rates: Record<string, number>;
}

export interface CashRequest {
  amount: number;
  /** Moeda do valor (local da consulta) */
  currency: string;
  /** Produto da consulta que originou o pagamento (nome traduzido na exibição) */
  productId?: string;
  /** Nome exato do item, quando veio de uma foto ou não está no catálogo */
  itemName?: string;
}
