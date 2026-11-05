import { useState } from 'react';
import { AdSlot } from '../components/AdSlot';
import { Button } from '../components/ui/Button';
import { ItemThumb } from '../components/DetectedItem';
import { PageTitle } from '../components/ui/Section';
import { cityOf } from '../data/cities';
import { CUSTOM_EMOJI, findProduct } from '../data/mockData';
import { useI18n } from '../i18n';
import { convert, formatMoney, formatDate, formatForeign, isSameCurrency } from '../lib/format';
import { VERDICT_META } from '../lib/pricing';
import type { Consultation, FxContext } from '../types';

interface HistoryScreenProps {
  history: Consultation[];
  fx: FxContext;
  onOpen: (consultation: Consultation) => void;
  onClear: () => void;
  onStart: () => void;
}

export function HistoryScreen({ history, fx, onOpen, onClear, onStart }: HistoryScreenProps) {
  const { t, productName } = useI18n();
  const [confirming, setConfirming] = useState(false);

  if (history.length === 0) {
    return (
      <div>
        <PageTitle title={t('history.title')} />
        <p className="mt-6 text-lg font-semibold">{t('history.emptyTitle')}</p>
        <p className="mt-1 text-ink-2">{t('history.emptyText')}</p>
        <Button className="mt-5" onClick={onStart}>
          {t('history.start')}
        </Button>
      </div>
    );
  }

  const fairShare = Math.round((history.filter((h) => h.verdict === 'fair').length / history.length) * 100);
  // Consultas em moedas diferentes: o total vai para a moeda do turista
  const currencies = new Set(history.map((h) => h.currency ?? 'BRL'));
  const taxCurrency = currencies.size === 1 ? [...currencies][0] : fx.code;
  const gringoTax = history.reduce((sum, h) => {
    const over = Math.max(0, h.price - h.range.fairMax);
    return sum + (convert(over, h.currency ?? 'BRL', taxCurrency, fx.rates) ?? 0);
  }, 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageTitle title={t('history.title')} />
        <Button
          variant="secondary"
          size="sm"
          className={confirming ? 'bg-abusive text-white hover:bg-abusive' : ''}
          onClick={() => {
            if (confirming) onClear();
            setConfirming(!confirming);
          }}
          onBlur={() => setConfirming(false)}
        >
          {confirming ? t('common.confirm') : t('common.clear')}
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-3 divide-x divide-line border-y border-line py-4 rtl:divide-x-reverse">
        <Stat label={t('history.checks')} value={String(history.length)} />
        <Stat label={t('history.fairShare')} value={`${fairShare}%`} />
        <Stat label={t('history.gringoTax')} value={formatMoney(gringoTax, taxCurrency)} />
      </div>

      <ul className="divide-y divide-line">
        {history.map((h) => {
          const product = findProduct(h.productId);
          const meta = VERDICT_META[h.verdict];
          const currency = h.currency ?? 'BRL';
          return (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => onOpen(h)}
                className="-mx-4 flex w-[calc(100%+2rem)] items-center gap-4 px-4 py-4 text-start active:bg-muted"
              >
                <ItemThumb image={h.item?.image} emoji={product?.emoji ?? CUSTOM_EMOJI} className="rounded-lg" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{h.item?.name ?? (product ? productName(product) : '')}</span>
                  <span className="block truncate text-sm text-ink-2">
                    {cityOf(h).name} · {formatDate(h.createdAt)}
                  </span>
                </span>
                <span className="shrink-0 text-end">
                  <span dir="ltr" className="block font-semibold tabular-nums">
                    {formatMoney(h.price, currency)}
                  </span>
                  {!isSameCurrency(fx, currency) && (
                    <span className="block text-sm text-ink-2">{formatForeign(h.price, fx, currency)}</span>
                  )}
                  <span className="mt-0.5 flex items-center justify-end gap-1.5 text-xs font-semibold" style={{ color: meta.text }}>
                    <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
                    {t(`verdict.${h.verdict}.short`)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <AdSlot placement="history" className="mt-8" />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 first:ps-0">
      <p className="text-xl font-bold tabular-nums leading-tight">{value}</p>
      <p className="mt-0.5 text-xs leading-tight text-ink-2">{label}</p>
    </div>
  );
}
