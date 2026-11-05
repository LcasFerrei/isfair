import type { Denomination, WalletCurrency } from '../types';
import { BANKNOTES, COINS } from './mockData';
import { WORLD_MONEY } from './worldMoney';

/*
 * Dólar (série atual) e euro (série Europa): dimensões oficiais em mm e cores predominantes do verso.
 * No dólar todas as notas têm o mesmo tamanho e tons parecidos — justamente por isso o app ajuda.
 */
const USD_ISSUER = 'THE UNITED STATES OF AMERICA';
const usdNote = (value: number, words: string, label: string, emoji: string, paper: string, ink: string): Denomination => ({
  value,
  kind: 'note',
  label,
  words,
  emoji,
  size: [156, 66],
  paper,
  ink,
  issuer: USD_ISSUER,
});

const USD_NOTES: Denomination[] = [
  usdNote(1, 'ONE DOLLAR', 'George Washington', '🦅', '#E3E8DA', '#2F5D3A'),
  usdNote(2, 'TWO DOLLARS', 'Thomas Jefferson', '📜', '#E1E6D8', '#33603F'),
  usdNote(5, 'FIVE DOLLARS', 'Abraham Lincoln', '🏛️', '#E6E0EA', '#5B4B73'),
  usdNote(10, 'TEN DOLLARS', 'Alexander Hamilton', '🏛️', '#EEE2D2', '#8A5A2B'),
  usdNote(20, 'TWENTY DOLLARS', 'Andrew Jackson', '🏛️', '#E2EADF', '#3E6B4A'),
  usdNote(50, 'FIFTY DOLLARS', 'Ulysses S. Grant', '🏛️', '#E7DFE6', '#6B3F5E'),
  usdNote(100, 'ONE HUNDRED DOLLARS', 'Benjamin Franklin', '🔔', '#DCE8E8', '#2D6670'),
];

const USD_COINS: Denomination[] = [
  { value: 0.25, kind: 'coin', label: 'Quarter', words: 'QUARTER', size: [24.3, 24.3], metal: 'silver' },
  { value: 0.1, kind: 'coin', label: 'Dime', words: 'DIME', size: [17.9, 17.9], metal: 'silver' },
  { value: 0.05, kind: 'coin', label: 'Nickel', words: 'NICKEL', size: [21.2, 21.2], metal: 'silver' },
  { value: 0.01, kind: 'coin', label: 'Penny', words: 'CENT', size: [19.1, 19.1], metal: 'copper' },
];

const EUR_ISSUER = 'BCE ECB EZB EKT EKP';
const eurNote = (value: number, size: [number, number], paper: string, ink: string): Denomination => ({
  value,
  kind: 'note',
  label: '',
  words: 'EURO',
  emoji: '🌉',
  size,
  paper,
  ink,
  issuer: EUR_ISSUER,
});

const EUR_NOTES: Denomination[] = [
  eurNote(5, [120, 62], '#E3E3E1', '#5E6266'),
  eurNote(10, [127, 67], '#F2DAD6', '#B03A32'),
  eurNote(20, [133, 72], '#D9E3F0', '#2F5597'),
  eurNote(50, [140, 77], '#F5E1C8', '#C46A1C'),
  eurNote(100, [147, 77], '#DDECD9', '#3F8040'),
  eurNote(200, [153, 77], '#F3E8C6', '#A5841F'),
];

const EUR_COINS: Denomination[] = [
  { value: 2, kind: 'coin', label: '2 euro', words: 'EURO', size: [25.75, 25.75], metal: 'bimetal' },
  { value: 1, kind: 'coin', label: '1 euro', words: 'EURO', size: [23.25, 23.25], metal: 'bimetalInverse' },
  { value: 0.5, kind: 'coin', label: '50 cent', words: 'EURO CENT', size: [24.25, 24.25], metal: 'gold' },
  { value: 0.2, kind: 'coin', label: '20 cent', words: 'EURO CENT', size: [22.25, 22.25], metal: 'gold' },
  { value: 0.1, kind: 'coin', label: '10 cent', words: 'EURO CENT', size: [19.75, 19.75], metal: 'gold' },
  { value: 0.05, kind: 'coin', label: '5 cent', words: 'EURO CENT', size: [21.25, 21.25], metal: 'copper' },
  { value: 0.02, kind: 'coin', label: '2 cent', words: 'EURO CENT', size: [18.75, 18.75], metal: 'copper' },
  { value: 0.01, kind: 'coin', label: '1 cent', words: 'EURO CENT', size: [16.25, 16.25], metal: 'copper' },
];

export interface MoneySet {
  notes: Denomination[];
  coins: Denomination[];
}

/** Cédulas e moedas de cada moeda com carteira (notas da menor para a maior; moedas da maior para a menor). */
const withCurrency = (currency: WalletCurrency, list: Denomination[]) => list.map((d) => ({ ...d, currency }));

const set = (currency: WalletCurrency, notes: Denomination[], coins: Denomination[]): MoneySet => ({
  notes: withCurrency(currency, notes),
  coins: withCurrency(currency, coins),
});

const world = (currency: keyof typeof WORLD_MONEY) =>
  set(currency, WORLD_MONEY[currency].notes, WORLD_MONEY[currency].coins);

/** Mesma ordem da lista de moedas do app: as mais usadas primeiro */
export const MONEY: Record<WalletCurrency, MoneySet> = {
  BRL: set('BRL', BANKNOTES, COINS),
  USD: set('USD', USD_NOTES, USD_COINS),
  EUR: set('EUR', EUR_NOTES, EUR_COINS),
  GBP: world('GBP'),
  ARS: world('ARS'),
  CLP: world('CLP'),
  UYU: world('UYU'),
  PYG: world('PYG'),
  BOB: world('BOB'),
  PEN: world('PEN'),
  COP: world('COP'),
  CAD: world('CAD'),
  MXN: world('MXN'),
  CHF: world('CHF'),
  AUD: world('AUD'),
  CNY: world('CNY'),
  JPY: world('JPY'),
  KRW: world('KRW'),
  INR: world('INR'),
  ILS: world('ILS'),
};

export const WALLET_CURRENCIES = Object.keys(MONEY) as WalletCurrency[];

export const isWalletCurrency = (code: string): code is WalletCurrency => code in MONEY;
