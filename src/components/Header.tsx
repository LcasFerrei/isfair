import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Bell, Check, ChevronDown, Loader2, LocateFixed, MapPin, Menu } from 'lucide-react';
import { CURRENCIES } from '../data/mockData';
import { useI18n, type UiKey } from '../i18n';
import { cn } from '../lib/cn';
import { formatDate, formatFx } from '../lib/format';
import { locateCity, type GeoErrorKey } from '../lib/geo';
import type { PickerKind } from '../screens/SettingsScreen';
import type { City, CurrencyCode } from '../types';
import { Link } from '../router';
import { CityPicker } from './CityPicker';
import { LanguageSheet } from './LanguageSheet';
import { Logo } from './Logo';
import { Flag, FlagCircle, type FlagCode } from './ui/Flag';
import { Sheet } from './ui/Sheet';

interface HeaderProps {
  city: City;
  onCityChange: (city: City) => void;
  currency: CurrencyCode;
  onCurrencyChange: (code: CurrencyCode) => void;
  /** Reais por unidade de cada moeda (todas as da API) */
  rates: Record<string, number>;
  /** Data da cotação; null quando está usando a reserva offline */
  ratesUpdatedAt: number | null;
  /** Seletor aberto (controlado pelo App para a tela de Configurações também poder abrir) */
  picker: PickerKind | null;
  onPickerChange: (picker: PickerKind | null) => void;
  /** Detectar a cidade ao abrir o app, se a localização já foi autorizada */
  autoLocate: boolean;
  onMenuOpen: () => void;
  unreadNotifications: number;
  onNotificationsOpen: () => void;
}

const CURRENCY_GROUPS = [...new Set(CURRENCIES.map((c) => c.group))];

export function Header({
  city,
  onCityChange,
  currency,
  onCurrencyChange,
  rates,
  ratesUpdatedAt,
  picker,
  onPickerChange,
  autoLocate,
  onMenuOpen,
  unreadNotifications,
  onNotificationsOpen,
}: HeaderProps) {
  const { t, info, currencyName } = useI18n();
  const closePicker = () => onPickerChange(null);
  const [locating, setLocating] = useState(false);
  // Guardamos a chave/cidade, não o texto: assim o aviso muda junto com o idioma
  const [locationError, setLocationError] = useState<GeoErrorKey | null>(null);
  const [locatedCity, setLocatedCity] = useState<City | null>(null);

  const detectCity = useCallback(
    async (silent = false) => {
      setLocating(true);
      setLocationError(null);
      try {
        const found = await locateCity(info.api);
        onCityChange(found);
        setLocatedCity(found);
        if (!silent) onPickerChange(null);
      } catch (error) {
        if (!silent) setLocationError((error as Error).message as GeoErrorKey);
      } finally {
        setLocating(false);
      }
    },
    [onCityChange, onPickerChange, info.api],
  );

  // Se o turista já autorizou a localização antes, atualiza a cidade sozinho ao abrir o app.
  useEffect(() => {
    if (!autoLocate || !window.isSecureContext || !navigator.permissions) return;
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((permission) => {
        if (permission.state === 'granted') void detectCity(true);
      })
      .catch(() => {});
    // Só ao abrir o app (ou ao religar a opção), não a cada nova referência de detectCity
  }, [autoLocate]);

  const errorText = locationError ? t(locationError as UiKey) : null;
  const locatedText = locatedCity
    ? t(locatedCity.curated ? 'header.located' : 'header.locatedEstimated', { city: locatedCity.name })
    : null;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2.5">
          <Link to="landing" aria-label="IsFair">
            <Logo tagline={t('header.tagline')} />
          </Link>
          <button
            type="button"
            onClick={onNotificationsOpen}
            aria-label={
              unreadNotifications > 0 ? t('header.notificationsUnread', { n: unreadNotifications }) : t('menu.notifications')
            }
            className="relative ms-auto grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-muted"
          >
            <Bell className="h-6 w-6" />
            {unreadNotifications > 0 && (
              <span className="absolute end-1 top-1 grid h-[18px] min-w-[18px] animate-scale-in place-items-center rounded-full bg-abusive px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white tabular-nums">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onMenuOpen}
            aria-label={t('header.openMenu')}
            className="-me-2 grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-muted"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Faixa com rolagem lateral: no celular nada é cortado, basta arrastar para o lado */}
        <div className="no-scrollbar -mx-4 mt-3 flex snap-x scroll-px-4 items-center gap-2 overflow-x-auto overscroll-x-contain px-4">
          <button
            type="button"
            onClick={() => {
              setLocationError(null);
              onPickerChange('city');
            }}
            className="flex h-9 shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-full border border-line pe-2.5 ps-3 text-sm font-semibold transition-colors hover:border-ink-3"
          >
            <MapPin className="h-4 w-4 shrink-0 text-ink-2" />
            <span>{city.name}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-ink-2" />
          </button>
          <button
            type="button"
            onClick={() => void detectCity()}
            disabled={locating}
            aria-label={t('header.locateAria')}
            title={t('header.locate')}
            className="grid h-9 w-9 shrink-0 snap-start place-items-center rounded-full border border-line text-ink-2 transition-colors hover:border-ink-3 hover:text-ink disabled:opacity-60"
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => onPickerChange('currency')}
            className="flex h-9 shrink-0 snap-start items-center gap-1.5 whitespace-nowrap rounded-full border border-line pe-2.5 ps-3 text-sm font-semibold transition-colors hover:border-ink-3"
          >
            <Flag code={CURRENCIES.find((c) => c.code === currency)?.flag ?? 'US'} className="h-3.5" />
            {currency}
            <ChevronDown className="h-4 w-4 text-ink-2" />
          </button>
          {formatFx(currency, city.currency, rates) && (
            <button
              type="button"
              onClick={() => onPickerChange('currency')}
              className="flex h-9 shrink-0 snap-start items-center whitespace-nowrap rounded-full bg-muted px-3 text-xs font-medium tabular-nums text-ink-2 transition-colors hover:bg-muted-2"
            >
              <bdi dir="ltr">{formatFx(currency, city.currency, rates)}</bdi>
            </button>
          )}
        </div>

        {(locatedText || (errorText && picker !== 'city')) && (
          <p
            className={cn(
              'mt-2 flex animate-fade-in items-start gap-1.5 text-xs',
              errorText ? 'text-abusive-text' : 'text-ink-2',
            )}
          >
            <MapPin className="mt-px h-3.5 w-3.5 shrink-0" />
            {errorText ?? locatedText}
          </p>
        )}
      </div>

      <CityPicker
        open={picker === 'city'}
        onClose={closePicker}
        current={city}
        onSelect={(next) => {
          setLocatedCity(null);
          onCityChange(next);
        }}
        locating={locating}
        locationError={errorText}
        onLocate={() => void detectCity()}
      />

      <Sheet open={picker === 'currency'} onClose={closePicker} title={t('currency.title')}>
        {CURRENCY_GROUPS.map((group) => (
          <section key={group}>
            <h3 className="mb-1 mt-4 text-sm font-semibold text-ink-2 first:mt-0">{t(`currencyGroup.${group}`)}</h3>
            <ul className="divide-y divide-line">
              {CURRENCIES.filter((c) => c.group === group).map((c) => (
                <li key={c.code}>
                  <PickerRow
                    selected={c.code === currency}
                    onClick={() => {
                      onCurrencyChange(c.code);
                      closePicker();
                    }}
                    flag={c.flag}
                    title={c.code}
                    subtitle={currencyName(c.code)}
                    trailing={
                      <span dir="ltr" className="shrink-0 text-end text-sm tabular-nums text-ink-2">
                        {formatFx(c.code, city.currency, rates)}
                      </span>
                    }
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p className="mt-4 text-xs text-ink-2">
          {ratesUpdatedAt ? t('currency.updated', { date: formatDate(ratesUpdatedAt) }) : t('currency.offline')}
        </p>
      </Sheet>

      <LanguageSheet open={picker === 'language'} onClose={closePicker} />
    </header>
  );
}

interface PickerRowProps {
  selected: boolean;
  onClick: () => void;
  flag: FlagCode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
}

function PickerRow({ selected, onClick, flag, title, subtitle, trailing }: PickerRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected ? 'true' : undefined}
      className="-mx-5 flex w-[calc(100%+2.5rem)] items-center gap-4 px-5 py-3 text-start transition-colors hover:bg-muted"
    >
      <FlagCircle code={flag} />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        {subtitle && <span className="block truncate text-sm text-ink-2">{subtitle}</span>}
      </span>
      {trailing}
      <Check className={cn('h-5 w-5 shrink-0', !selected && 'invisible')} strokeWidth={2.5} />
    </button>
  );
}
