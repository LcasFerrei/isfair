import { MONEY } from '../data/money';
import type { ChangePiece, Denomination, Wallet, WalletCurrency } from '../types';

export const toCents = (value: number) => Math.round(value * 100);

/** Todas as cédulas e moedas da moeda, da maior para a menor. */
export const allPieces = (currency: WalletCurrency): Denomination[] =>
  [...MONEY[currency].notes, ...MONEY[currency].coins].sort((a, b) => b.value - a.value);

export function walletTotal(wallet: Wallet): number {
  return Object.entries(wallet).reduce((sum, [value, count]) => sum + toCents(Number(value)) * count, 0);
}

/** Cédulas e moedas da carteira, da maior para a menor. */
export function walletPieces(wallet: Wallet, currency: WalletCurrency): ChangePiece[] {
  return allPieces(currency)
    .filter((d) => (wallet[d.value] ?? 0) > 0)
    .map((denom) => ({ denom, count: wallet[denom.value] }));
}

export function walletCounts(wallet: Wallet, currency: WalletCurrency) {
  const count = (list: Denomination[]) => list.reduce((sum, d) => sum + (wallet[d.value] ?? 0), 0);
  return { notes: count(MONEY[currency].notes), coins: count(MONEY[currency].coins) };
}

export const piecesToWallet = (pieces: ChangePiece[]): Wallet =>
  Object.fromEntries(pieces.map((p) => [p.denom.value, p.count]));

/** Soma (sign = 1) ou subtrai (sign = -1) peças de uma carteira, descartando contagens zeradas. */
export function mergeWallets(base: Wallet, delta: Wallet, sign: 1 | -1): Wallet {
  const next: Wallet = { ...base };
  for (const [key, n] of Object.entries(delta)) {
    const value = Number(key);
    const count = (next[value] ?? 0) + sign * n;
    if (count > 0) next[value] = count;
    else delete next[value];
  }
  return next;
}

/** Decompõe um valor no menor número de cédulas e moedas (real, dólar e euro são canônicos: o guloso é ótimo). */
export function breakdown(cents: number, currency: WalletCurrency): ChangePiece[] {
  const pieces: ChangePiece[] = [];
  let rest = cents;
  for (const denom of allPieces(currency)) {
    const unit = toCents(denom.value);
    const count = Math.floor(rest / unit);
    if (count > 0) {
      pieces.push({ denom, count });
      rest -= count * unit;
    }
  }
  return pieces;
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** Menor passo entre valores da moeda: 5 centavos no real, 1 centavo no dólar e no euro. */
const unitCents = (currency: WalletCurrency) => allPieces(currency).map((d) => toCents(d.value)).reduce(gcd);

/** Quanto "custa" entregar uma peça a mais, comparado a 1 centavo de troco. */
const PIECE_PENALTY_CENTS = 60;

/**
 * Escolhe, entre as peças que o turista tem, o que entregar: pouco troco e poucas peças.
 * Programação dinâmica limitada pelas quantidades da carteira. Retorna null se o saldo não cobre o total.
 */
export function planPayment(wallet: Wallet, totalCents: number, currency: WalletCurrency): Wallet | null {
  if (totalCents <= 0 || walletTotal(wallet) < totalCents) return null;

  const unit = unitCents(currency);
  const items = walletPieces(wallet, currency).map(({ denom, count }) => ({
    value: denom.value,
    units: toCents(denom.value) / unit,
    count,
  }));
  const target = Math.ceil(totalCents / unit);
  // Um pagamento mínimo nunca passa do alvo em mais do que a maior peça entregue.
  const maxUnits = Math.min(walletTotal(wallet) / unit, target + Math.max(...items.map((i) => i.units)));

  const INF = 1e9;
  const base = new Int32Array(maxUnits + 1).fill(INF);
  base[0] = 0;
  const layers: Int32Array[] = [];
  let prev = base;
  for (const item of items) {
    const next = new Int32Array(maxUnits + 1).fill(INF);
    for (let s = 0; s <= maxUnits; s++) {
      if (prev[s] === INF) continue;
      for (let c = 0; c <= item.count; c++) {
        const t = s + c * item.units;
        if (t > maxUnits) break;
        if (prev[s] + c < next[t]) next[t] = prev[s] + c;
      }
    }
    layers.push(next);
    prev = next;
  }

  let best = -1;
  let bestCost = Infinity;
  for (let s = target; s <= maxUnits; s++) {
    if (prev[s] === INF) continue;
    const cost = (s - target) * unit + prev[s] * PIECE_PENALTY_CENTS;
    if (cost < bestCost) {
      bestCost = cost;
      best = s;
    }
  }
  if (best < 0) return null;

  const pay: Wallet = {};
  let s = best;
  for (let k = items.length - 1; k >= 0; k--) {
    const before = k > 0 ? layers[k - 1] : base;
    for (let c = 0; c <= items[k].count; c++) {
      const t = s - c * items[k].units;
      if (t >= 0 && before[t] + c === layers[k][s]) {
        if (c > 0) pay[items[k].value] = c;
        s = t;
        break;
      }
    }
  }
  return pay;
}
