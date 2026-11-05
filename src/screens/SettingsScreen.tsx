import { useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Coins,
  History as HistoryIcon,
  Info,
  Languages,
  LocateFixed,
  MapPin,
  Wallet as WalletIcon,
} from 'lucide-react';
import { CityBadge } from '../components/CityPicker';
import { ConfirmSheet } from '../components/ui/ConfirmSheet';
import { IconCircle, ListRow, PageTitle } from '../components/ui/Section';
import { Flag } from '../components/ui/Flag';
import { Switch } from '../components/ui/Switch';
import { APP_VERSION } from '../config';
import { CURRENCIES } from '../data/mockData';
import { useI18n } from '../i18n';
import { formatMoney } from '../lib/format';
import type { City, CurrencyCode, WalletCurrency } from '../types';

export type PickerKind = 'city' | 'currency' | 'language';

interface SettingsScreenProps {
  city: City;
  currency: CurrencyCode;
  autoLocate: boolean;
  onAutoLocateChange: (value: boolean) => void;
  onOpenPicker: (kind: PickerKind) => void;
  historyCount: number;
  walletCents: number;
  walletCurrency: WalletCurrency;
  onClearHistory: () => void;
  onResetWallet: () => void;
  onBack: () => void;
}

export function SettingsScreen({
  city,
  currency,
  autoLocate,
  onAutoLocateChange,
  onOpenPicker,
  historyCount,
  walletCents,
  walletCurrency,
  onClearHistory,
  onResetWallet,
  onBack,
}: SettingsScreenProps) {
  const { t, tp, info, currencyName } = useI18n();
  const [confirm, setConfirm] = useState<'history' | 'wallet' | null>(null);
  const currencyInfo = CURRENCIES.find((c) => c.code === currency);
  const chevron = <ChevronRight className="h-5 w-5 shrink-0 self-center text-ink-3 rtl:-scale-x-100" />;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        aria-label={t('common.back')}
        className="-ms-2 mb-2 grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-muted"
      >
        <ArrowLeft className="h-6 w-6 rtl:-scale-x-100" />
      </button>
      <PageTitle title={t('settings.title')} />

      <Group title={t('settings.preferences')}>
        <ListRow
          icon={<IconCircle><Languages className="h-5 w-5" /></IconCircle>}
          title={t('settings.language')}
          subtitle={
            <span className="flex items-center gap-2">
              <Flag code={info.flag} />
              <bdi dir={info.dir}>{info.name}</bdi>
            </span>
          }
          trailing={chevron}
          onClick={() => onOpenPicker('language')}
        />
        <ListRow
          icon={<IconCircle><MapPin className="h-5 w-5" /></IconCircle>}
          title={t('settings.city')}
          subtitle={
            <span className="flex items-center gap-2">
              <span className="truncate">{city.name}</span>
              <CityBadge city={city} />
            </span>
          }
          trailing={chevron}
          onClick={() => onOpenPicker('city')}
        />
        <ListRow
          icon={<IconCircle><Coins className="h-5 w-5" /></IconCircle>}
          title={t('settings.currency')}
          subtitle={
            <span className="flex items-center gap-2">
              {currencyInfo && <Flag code={currencyInfo.flag} />}
              {currencyName(currency)} ({currency})
            </span>
          }
          trailing={chevron}
          onClick={() => onOpenPicker('currency')}
        />
        <ListRow
          icon={<IconCircle><LocateFixed className="h-5 w-5" /></IconCircle>}
          title={t('settings.autoLocate')}
          subtitle={t('settings.autoLocateHint')}
          trailing={<Switch checked={autoLocate} onChange={onAutoLocateChange} label={t('settings.autoLocate')} />}
        />
      </Group>

      <Group title={t('settings.data')}>
        <ListRow
          icon={<IconCircle><HistoryIcon className="h-5 w-5" /></IconCircle>}
          title={t('settings.clearHistory')}
          subtitle={tp('settings.savedChecks', historyCount)}
          trailing={chevron}
          onClick={historyCount > 0 ? () => setConfirm('history') : undefined}
        />
        <ListRow
          icon={<IconCircle><WalletIcon className="h-5 w-5" /></IconCircle>}
          title={t('settings.resetWallet')}
          subtitle={t('settings.balance', { amount: formatMoney(walletCents / 100, walletCurrency) })}
          trailing={chevron}
          onClick={walletCents > 0 ? () => setConfirm('wallet') : undefined}
        />
        <p className="mt-1 text-xs text-ink-2">{t('settings.localOnly')}</p>
      </Group>

      <Group title={t('settings.about')}>
        <ListRow
          icon={<IconCircle><Info className="h-5 w-5" /></IconCircle>}
          title={t('settings.version')}
          subtitle={t('settings.disclaimer')}
          trailing={<span className="self-center text-sm text-ink-2">{APP_VERSION}</span>}
        />
      </Group>

      <ConfirmSheet
        open={confirm === 'history'}
        onClose={() => setConfirm(null)}
        title={t('settings.clearHistoryTitle')}
        description={tp('settings.clearHistoryText', historyCount)}
        confirmLabel={t('settings.clearHistoryConfirm')}
        onConfirm={onClearHistory}
        danger
      />
      <ConfirmSheet
        open={confirm === 'wallet'}
        onClose={() => setConfirm(null)}
        title={t('settings.resetWalletTitle')}
        description={t('settings.resetWalletText')}
        confirmLabel={t('settings.resetWalletConfirm')}
        onConfirm={onResetWallet}
        danger
      />
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      <h3 className="mb-1 text-sm font-semibold text-ink-2">{title}</h3>
      <div className="divide-y divide-line">{children}</div>
    </section>
  );
}
