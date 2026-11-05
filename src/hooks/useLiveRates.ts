import { useEffect, useState } from 'react';
import { CURRENCIES } from '../data/mockData';

/** ExchangeRate-API (plano aberto): grátis, sem chave, atualizada uma vez por dia. */
const RATES_URL = 'https://open.er-api.com/v6/latest/BRL';
const CACHE_KEY = 'isfair:fx-rates';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export interface LiveRates {
  /**
   * Reais por 1 unidade de cada moeda (ISO 4217). Inclui todas as moedas da API — não só as
   * da lista de "sua moeda" —, para converter a moeda local de qualquer país.
   */
  rates: Record<string, number>;
  /** Quando a fonte atualizou a cotação (null = usando a reserva offline) */
  updatedAt: number | null;
}

interface CachedRates extends LiveRates {
  fetchedAt: number;
}

/** Reserva offline: as moedas da lista + o próprio real */
const fallbackRates = (): Record<string, number> => ({
  BRL: 1,
  ...Object.fromEntries(CURRENCIES.map((c) => [c.code, c.baseRate])),
});

function readCache(): CachedRates | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedRates;
    // Garante que moedas adicionadas depois do cache também tenham valor
    return { ...cached, rates: { ...fallbackRates(), ...cached.rates } };
  } catch {
    return null;
  }
}

/** Cotação do dia com cache de 6 h; sem internet, usa a cotação de reserva de cada moeda. */
export function useLiveRates(): LiveRates {
  const [state, setState] = useState<CachedRates>(
    () => readCache() ?? { rates: fallbackRates(), updatedAt: null, fetchedAt: 0 },
  );

  useEffect(() => {
    if (Date.now() - state.fetchedAt < CACHE_TTL_MS) return;
    const controller = new AbortController();
    fetch(RATES_URL, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((data: { result: string; rates: Record<string, number>; time_last_update_unix: number }) => {
        if (data.result !== 'success') return;
        // A API dá "quantas unidades valem 1 real"; guardamos o inverso (reais por unidade)
        const rates = fallbackRates();
        for (const [code, perReal] of Object.entries(data.rates)) {
          if (perReal > 0) rates[code] = 1 / perReal;
        }
        const next = { rates, updatedAt: data.time_last_update_unix * 1000, fetchedAt: Date.now() };
        setState(next);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(next));
        } catch {
          // sem storage: busca de novo na próxima abertura
        }
      })
      .catch(() => {
        // offline ou API fora: mantém a cotação atual
      });
    return () => controller.abort();
    // Só na abertura do app; o cache decide se precisa buscar
  }, []);

  return { rates: state.rates, updatedAt: state.updatedAt };
}
