import type { ReactNode } from 'react';
import { useI18n } from '../../i18n';
import { currencySymbol, sanitizeMoneyInput } from '../../lib/format';

interface MoneyFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: ReactNode;
  /** Moeda do valor; padrão: a moeda local da cidade */
  currency?: string;
}

export function MoneyField({ id, label, value, onChange, hint, currency }: MoneyFieldProps) {
  const { t } = useI18n();
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-ink-2">
        {label}
      </label>
      {/* Valores em dinheiro ficam sempre da esquerda para a direita, também em árabe */}
      <div dir="ltr" className="mt-2 flex h-16 items-center gap-2 rounded-lg bg-muted px-4 transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-ink">
        <span className="text-2xl font-semibold text-ink-2">{currencySymbol(currency)}</span>
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder={t('money.placeholder')}
          value={value}
          onChange={(e) => onChange(sanitizeMoneyInput(e.target.value))}
          className="w-full min-w-0 bg-transparent text-[28px] font-bold tabular-nums outline-none placeholder:text-ink-3"
        />
      </div>
      {hint && <p className="mt-2 text-sm text-ink-2">{hint}</p>}
    </div>
  );
}
