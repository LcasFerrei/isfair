import { useI18n } from '../i18n';
import { cn } from '../lib/cn';
import { currencySymbol, formatAmount } from '../lib/format';
import { VERDICT_META } from '../lib/pricing';
import type { PriceRange, VerdictLevel } from '../types';

interface PriceRangeBarProps {
  range: PriceRange;
  /** Faixa em destaque; null mostra as três coloridas, como legenda */
  verdict: VerdictLevel | null;
  /** Moeda da faixa; padrão: a moeda local da cidade */
  currency?: string;
}

/** Semáforo das três faixas (justo / área turística / Gringo Tax) com os valores de cada uma. */
export function PriceRangeBar({ range, verdict, currency }: PriceRangeBarProps) {
  const { t } = useI18n();
  // Limites exatos (a IA pode devolver centavos): turístico vai do teto justo ao teto turístico
  const f = formatAmount;
  const symbol = currencySymbol(currency);
  const segments: { level: VerdictLevel; value: string }[] = [
    { level: 'fair', value: `${symbol} ${f(range.fairMin)}–${f(range.fairMax)}` },
    { level: 'tourist', value: `${symbol} ${f(range.fairMax)}–${f(range.touristMax)}` },
    { level: 'abusive', value: `> ${symbol} ${f(range.touristMax)}` },
  ];

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {segments.map((s) => {
        const active = verdict === s.level;
        const dimmed = verdict !== null && !active;
        return (
          <div key={s.level}>
            <div
              className="h-1.5 rounded-full transition-colors"
              style={{ background: dimmed ? '#E6E9EF' : VERDICT_META[s.level].color }}
            />
            <p className={cn('mt-2 text-sm', active ? 'font-semibold' : 'text-ink-2')}>{t(`verdict.${s.level}.short`)}</p>
            <p dir="ltr" className={cn('text-start text-sm tabular-nums', active ? 'font-semibold' : 'text-ink-2')}>
              {s.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
