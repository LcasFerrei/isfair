import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  BellRing,
  CheckCheck,
  MapPin,
  ShieldAlert,
  Smartphone,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet as WalletIcon,
  X,
  type LucideIcon,
} from 'lucide-react';
import { ConfirmSheet } from '../components/ui/ConfirmSheet';
import { IconCircle, ListRow, PageTitle } from '../components/ui/Section';
import { Switch } from '../components/ui/Switch';
import { findProduct } from '../data/mockData';
import { deviceSupport, type DeviceSupport, type NotificationsApi } from '../hooks/useNotifications';
import type { I18n } from '../i18n';
import { useI18n } from '../i18n';
import { cn } from '../lib/cn';
import { formatFx, formatMoney, formatRelative } from '../lib/format';
import type { AppNotification, CurrencyCode, NotificationPrefs } from '../types';

/** Título e texto da notificação no idioma atual (usado também na notificação do sistema). */
export function describeNotification(n: AppNotification, i18n: I18n, rates: Record<string, number>) {
  const { t, currencyName, productName } = i18n;
  switch (n.kind) {
    case 'welcome':
      return { title: t('notif.welcomeTitle'), body: t('notif.welcomeBody') };
    case 'city':
      return {
        title: t('notif.cityTitle', { city: n.city }),
        body: t('notif.cityBody', { currency: `${currencyName(n.currency as CurrencyCode) || n.currency} (${n.currency})` }),
      };
    case 'fx': {
      const pct = Math.abs(n.pct).toLocaleString(undefined, { maximumFractionDigits: 1 });
      return {
        title: t(n.pct > 0 ? 'notif.fxUpTitle' : 'notif.fxDownTitle', { home: n.home, local: n.local, pct }),
        body: t('notif.fxBody', { rate: formatFx(n.home, n.local, rates) }),
      };
    }
    case 'payment': {
      const paid = formatMoney(n.paidCents / 100, n.currency);
      return {
        title: t('notif.paymentTitle'),
        body:
          n.changeCents > 0
            ? t('notif.paymentChange', { paid, change: formatMoney(n.changeCents / 100, n.currency) })
            : t('notif.paymentExact', { paid }),
      };
    }
    case 'gringoTax': {
      const product = findProduct(n.productId);
      return {
        title: t('notif.gringoTitle'),
        body: t('notif.gringoBody', {
          item: n.itemName ?? (product ? productName(product) : ''),
          amount: formatMoney(n.overAmount, n.currency),
          city: n.city,
        }),
      };
    }
  }
}

function iconOf(n: AppNotification): { Icon: LucideIcon; tone: string } {
  switch (n.kind) {
    case 'welcome':
      return { Icon: Sparkles, tone: 'bg-ink text-white' };
    case 'city':
      return { Icon: MapPin, tone: 'bg-muted text-ink' };
    case 'fx':
      return n.pct > 0 ? { Icon: TrendingUp, tone: 'bg-fair/20 text-ink' } : { Icon: TrendingDown, tone: 'bg-tourist/25 text-ink' };
    case 'payment':
      return { Icon: WalletIcon, tone: 'bg-fair/20 text-ink' };
    case 'gringoTax':
      return { Icon: ShieldAlert, tone: 'bg-abusive/15 text-abusive-text' };
  }
}

interface NotificationsScreenProps {
  notifications: NotificationsApi;
  rates: Record<string, number>;
  onOpen: (n: AppNotification) => void;
  /** Só em desenvolvimento: envia um aviso de exemplo */
  onDemo?: () => void;
  onBack: () => void;
}

const PREF_ROWS: { key: Exclude<keyof NotificationPrefs, 'device'>; Icon: LucideIcon }[] = [
  { key: 'city', Icon: MapPin },
  { key: 'fx', Icon: TrendingUp },
  { key: 'payment', Icon: WalletIcon },
  { key: 'gringoTax', Icon: ShieldAlert },
];

export function NotificationsScreen({ notifications, rates, onOpen, onDemo, onBack }: NotificationsScreenProps) {
  const i18n = useI18n();
  const { t } = i18n;
  const { items, unread, prefs } = notifications;
  const [confirmClear, setConfirmClear] = useState(false);
  const [device, setDevice] = useState<DeviceSupport>(deviceSupport);

  // Ao sair da tela, o que foi visto conta como lido (o destaque continua enquanto a tela está aberta)
  const { markAllRead } = notifications;
  useEffect(() => () => markAllRead(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleDevice = async (on: boolean) => {
    if (!on) {
      notifications.setPref('device', false);
      return;
    }
    setDevice(await notifications.enableDevice());
  };

  const deviceHint =
    device === 'unsupported'
      ? t('notif.deviceUnsupported')
      : device === 'denied'
        ? t('notif.deviceDenied')
        : t('notif.deviceHint');

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
      <div className="flex items-end justify-between gap-3">
        <PageTitle
          title={t('notif.title')}
          subtitle={unread > 0 ? i18n.tp('notif.unread', unread) : t('notif.allRead')}
        />
        {unread > 0 && (
          <button
            type="button"
            onClick={notifications.markAllRead}
            className="mb-1 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-muted px-3 text-sm font-medium transition-colors hover:bg-muted-2"
          >
            <CheckCheck className="h-4 w-4" /> {t('notif.markAllRead')}
          </button>
        )}
      </div>

      {onDemo && (
        <button
          type="button"
          onClick={onDemo}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line py-3 text-sm font-semibold text-ink-2 transition-colors hover:border-ink hover:text-ink"
        >
          <BellRing className="h-4 w-4" /> {t('notif.demo')}
        </button>
      )}

      {items.length === 0 ? (
        <div className="mt-10 flex animate-fade-in flex-col items-center text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-muted">
            <Bell className="h-7 w-7 text-ink-2" />
          </span>
          <p className="mt-4 text-lg font-semibold">{t('notif.emptyTitle')}</p>
          <p className="mt-1 max-w-xs text-ink-2">{t('notif.emptyText')}</p>
        </div>
      ) : (
        <>
          <ul className="mt-5 divide-y divide-line">
            {items.map((n, i) => {
              const { title, body } = describeNotification(n, i18n, rates);
              const { Icon, tone } = iconOf(n);
              return (
                <li
                  key={n.id}
                  className={cn('relative -mx-4 flex animate-fade-in items-start', !n.read && 'bg-fair/5')}
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      notifications.markRead(n.id);
                      onOpen(n);
                    }}
                    className="flex min-w-0 flex-1 items-start gap-3 py-4 ps-4 text-start transition-colors active:bg-muted"
                  >
                    <span className={cn('relative grid h-10 w-10 shrink-0 place-items-center rounded-full', tone)}>
                      <Icon className="h-5 w-5" />
                      {!n.read && (
                        <span className="absolute -end-0.5 -top-0.5 h-3 w-3 rounded-full bg-fair ring-2 ring-white" aria-hidden />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block', n.read ? 'font-medium' : 'font-semibold')}>{title}</span>
                      <span className="mt-0.5 block text-sm text-ink-2">{body}</span>
                      <span className="mt-1 block text-xs text-ink-3">{formatRelative(n.createdAt)}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => notifications.remove(n.id)}
                    aria-label={t('notif.remove')}
                    className="me-2 mt-3 grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-muted hover:text-ink"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="mt-3 text-sm font-medium text-ink-2 underline-offset-4 hover:underline"
          >
            {t('notif.clearAll')}
          </button>
        </>
      )}

      <section className="mt-8">
        <h3 className="mb-1 text-sm font-semibold text-ink-2">{t('notif.prefsTitle')}</h3>
        <div className="divide-y divide-line">
          {PREF_ROWS.map(({ key, Icon }) => (
            <ListRow
              key={key}
              icon={<IconCircle><Icon className="h-5 w-5" /></IconCircle>}
              title={t(`notif.pref.${key}`)}
              subtitle={t(`notif.pref.${key}Hint`)}
              trailing={
                <Switch checked={prefs[key]} onChange={(v) => notifications.setPref(key, v)} label={t(`notif.pref.${key}`)} />
              }
            />
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h3 className="mb-1 text-sm font-semibold text-ink-2">{t('notif.deviceTitle')}</h3>
        <ListRow
          icon={<IconCircle>{prefs.device ? <BellRing className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}</IconCircle>}
          title={t('notif.deviceToggle')}
          subtitle={deviceHint}
          trailing={
            device === 'unsupported' ? undefined : (
              <Switch checked={prefs.device && device === 'granted'} onChange={toggleDevice} label={t('notif.deviceToggle')} />
            )
          }
        />
      </section>

      <ConfirmSheet
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title={t('notif.clearTitle')}
        description={t('notif.clearDescription')}
        confirmLabel={t('notif.clearConfirm')}
        onConfirm={notifications.clear}
        danger
      />
    </div>
  );
}
