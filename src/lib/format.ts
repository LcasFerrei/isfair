import type { FxContext } from '../types';

/** Locale dos formatadores; trocado pelo I18nProvider quando o idioma muda. */
let locale = 'pt-BR';
/** Moeda local (da cidade atual), usada quando formatMoney não recebe uma moeda explícita. */
let localCurrency = 'BRL';
const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>();

export function setFormatLocale(next: string) {
  if (next === locale) return;
  locale = next;
  cache.clear();
}

/** Chamado pelo App quando a cidade (e portanto a moeda local) muda. */
export function setLocalCurrency(code: string) {
  localCurrency = code;
}

export const getLocalCurrency = () => localCurrency;

function numberFormat(id: string, options: Intl.NumberFormatOptions) {
  const key = `n:${id}`;
  if (!cache.has(key)) cache.set(key, new Intl.NumberFormat(locale, options));
  return cache.get(key) as Intl.NumberFormat;
}

/** Valor em dinheiro na moeda local (ou na moeda informada): "R$ 12,00", "US$ 3,50", "€ 2,00"… */
export const formatMoney = (value: number, currency: string = localCurrency) =>
  numberFormat(`cur:${currency}`, { style: 'currency', currency }).format(value);

/** Só o símbolo da moeda no idioma atual ("R$", "US$", "€", "$"…). */
export function currencySymbol(currency: string = localCurrency) {
  return numberFormat(`cur:${currency}`, { style: 'currency', currency }).formatToParts(0).find((p) => p.type === 'currency')?.value ?? currency;
}

/** Número sem símbolo, com até 2 casas no formato do idioma ("4", "2,5", "2.5"). */
export const formatAmount = (value: number) => numberFormat('amount', { maximumFractionDigits: 2 }).format(value);

/** Converte entre duas moedas usando as cotações (reais por unidade). null se faltar alguma cotação. */
export function convert(value: number, from: string, to: string, rates: Record<string, number>): number | null {
  if (from === to) return value;
  const fromRate = rates[from];
  const toRate = rates[to];
  return fromRate && toRate ? (value * fromRate) / toRate : null;
}

const RELATIVE_STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['minute', 60],
  ['hour', 24],
  ['day', 7],
];

/** "agora", "há 5 minutos", "ontem"…; depois de uma semana, a data. */
export function formatRelative(timestamp: number, now = Date.now()) {
  let amount = Math.round((timestamp - now) / 60000);
  if (amount > -1) return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(0, 'second');
  for (const [unit, size] of RELATIVE_STEPS) {
    if (Math.abs(amount) < size) return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(amount, unit);
    amount = Math.round(amount / size);
  }
  return formatDate(timestamp);
}

/**
 * Cotação legível entre a moeda de casa e a local, nos dois sentidos:
 * "1 USD = R$ 5,04" para moedas fortes e "R$ 1 = 303 ARS" quando a de casa vale pouco.
 */
export function formatFx(home: string, local: string, rates: Record<string, number>) {
  if (home === local) return '';
  const localPerHome = convert(1, home, local, rates);
  if (localPerHome === null) return '';
  if (localPerHome >= 0.1) {
    const value = numberFormat(`rate:${local}`, { style: 'currency', currency: local, maximumFractionDigits: 3 }).format(localPerHome);
    return `1 ${home} = ${value}`;
  }
  const homePerLocal = 1 / localPerHome;
  const amount = numberFormat(homePerLocal >= 100 ? 'int' : 'dec2', { maximumFractionDigits: homePerLocal >= 100 ? 0 : 2 }).format(
    homePerLocal,
  );
  return `${formatMoney(1, local).replace(/[.,]00$/, '')} = ${amount} ${home}`;
}

/** A moeda de casa é a mesma do valor: as conversões ≈ ficam escondidas por serem repetidas. */
export const isSameCurrency = (fx: FxContext, from: string = fx.local) => from === fx.code;

/** Valor (na moeda local, ou em `from`) convertido para a moeda de casa do turista. Vazio se não houver cotação. */
export function formatForeign(value: number, fx: FxContext, from: string = fx.local) {
  const converted = convert(value, from, fx.code, fx.rates);
  return converted === null ? '' : formatMoney(converted, fx.code);
}

export function formatDate(timestamp: number) {
  const key = 'd:short';
  if (!cache.has(key)) {
    cache.set(key, new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }));
  }
  return (cache.get(key) as Intl.DateTimeFormat).format(timestamp);
}

/**
 * Lê um valor digitado em qualquer formato: "12,50", "12.50", "1.200,00" e "1,200.00".
 * Com os dois separadores, o último é o decimal. Retorna NaN para entradas inválidas.
 */
export function parseMoney(input: string): number {
  const value = input.trim();
  if (!value) return NaN;
  const lastComma = value.lastIndexOf(',');
  const lastDot = value.lastIndexOf('.');
  // Com os dois separadores, o último é o decimal ("1.234,50" / "1,234.50")
  if (lastComma >= 0 && lastDot >= 0) {
    const decimal = lastComma > lastDot ? ',' : '.';
    const thousands = decimal === ',' ? '.' : ',';
    return Number(value.split(thousands).join('').replace(decimal, '.'));
  }
  // Com um só: repetido ou seguido de 3 dígitos é milhar ("10.000", "1,500"), já que dinheiro não tem 3 casas
  const sep = lastComma >= 0 ? ',' : lastDot >= 0 ? '.' : null;
  if (!sep) return Number(value);
  const parts = value.split(sep);
  const grouping = parts.length > 2 || parts[parts.length - 1].length === 3;
  return Number(grouping ? parts.join('') : parts.join('.'));
}

/** Valor para preencher um campo de dinheiro, com o separador decimal do idioma atual. */
export function toInputValue(value: number) {
  if (Number.isInteger(value)) return String(value);
  const decimal = numberFormat('plain', {}).formatToParts(1.5).find((p) => p.type === 'decimal')?.value ?? ',';
  return value.toFixed(2).replace('.', decimal);
}

export const sanitizeMoneyInput = (value: string) => value.replace(/[^\d.,]/g, '');

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
