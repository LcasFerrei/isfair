import { useEffect, useMemo, useRef, useState } from 'react';
import { History as HistoryIcon, Home, LifeBuoy, Bell, FileText, Languages, ScanLine, Settings, Wallet as WalletIcon } from 'lucide-react';
import { useAuth } from './auth/AuthContext';
import { AppMenu, type MenuSection } from './components/AppMenu';
import { BottomNav } from './components/BottomNav';
import { Header } from './components/Header';
import { NotificationToast } from './components/NotificationToast';
import { ConfirmSheet } from './components/ui/ConfirmSheet';
import { DEFAULT_CITY, cityOf, getCity } from './data/cities';
import { CUSTOM_PRODUCT_ID, detectCurrency, findProduct } from './data/mockData';
import { isWalletCurrency } from './data/money';
import { localCurrencyFor } from './data/worldCurrencies';
import { useLiveRates } from './hooks/useLiveRates';
import { useNotifications, type NewNotification } from './hooks/useNotifications';
import { useI18n } from './i18n';
import { useRouter } from './router';
import { useLocalStorage } from './hooks/useLocalStorage';
import { breakdown, mergeWallets, piecesToWallet, walletTotal } from './lib/cash';
import { convert, setLocalCurrency, uid } from './lib/format';
import { communityKey, getVerdict, initialCommunityStats, pickTipIndex } from './lib/pricing';
import { HistoryScreen } from './screens/HistoryScreen';
import { NotificationsScreen, describeNotification } from './screens/NotificationsScreen';
import { ResultScreen } from './screens/ResultScreen';
import { ScannerScreen, type Verification } from './screens/ScannerScreen';
import { SettingsScreen, type PickerKind } from './screens/SettingsScreen';
import { WalletScreen } from './screens/WalletScreen';
import type {
  CashRequest,
  City,
  CommunityStats,
  Consultation,
  AppNotification,
  CurrencyCode,
  FxContext,
  Tab,
  Wallet,
  WalletCurrency,
  WalletTx,
} from './types';

const HISTORY_LIMIT = 50;
const WALLET_TX_LIMIT = 100;
/** Variação do câmbio (desde o último aviso) que vira notificação */
const FX_ALERT_PCT = 1.5;

type Wallets = Partial<Record<WalletCurrency, Wallet>>;

/** Carteiras por moeda; a carteira antiga (só em reais, chave isfair:wallet) vira a de BRL. */
function initialWallets(): Wallets {
  try {
    const legacy = localStorage.getItem('isfair:wallet');
    return legacy ? { BRL: JSON.parse(legacy) as Wallet } : {};
  } catch {
    return {};
  }
}

/** Cidades salvas antes da mudança não tinham moeda local */
const withCurrency = (city: City): City => (city.currency ? city : { ...city, currency: localCurrencyFor(city.countryCode) });

export default function App() {
  // Consumir o contexto aqui faz a árvore inteira renderizar de novo ao trocar o idioma
  const i18n = useI18n();
  const { t } = i18n;
  const { user, signOut } = useAuth();
  const { navigate } = useRouter();
  const [tab, setTab] = useState<Tab>('scanner');
  const [storedCity, setCity] = useLocalStorage<City>('isfair:city-v2', DEFAULT_CITY);
  const [currency, setCurrency] = useLocalStorage<CurrencyCode>('isfair:currency', detectCurrency());
  const [history, setHistory] = useLocalStorage<Consultation[]>('isfair:history', []);
  const [community, setCommunity] = useLocalStorage<Record<string, CommunityStats>>('isfair:community', {});
  const [productId, setProductId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [cashRequest, setCashRequest] = useState<CashRequest | null>(null);
  const [wallets, setWallets] = useLocalStorage<Wallets>('isfair:wallets', initialWallets());
  const [walletTx, setWalletTx] = useLocalStorage<WalletTx[]>('isfair:wallet-tx', []);
  const [autoLocate, setAutoLocate] = useLocalStorage('isfair:auto-locate', true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [picker, setPicker] = useState<PickerKind | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const live = useLiveRates();
  const notifications = useNotifications((n) => describeNotification(n, i18n, live.rates));
  /** Cotação no último aviso de câmbio, por par "casa/local" */
  const [fxBaseline, setFxBaseline] = useLocalStorage<Record<string, number>>('isfair:fx-baseline', {});

  // Cidades com dados locais são relidas do código, para refletir faixas e dicas atualizadas.
  const city = storedCity.curated ? getCity(storedCity.id) : withCurrency(storedCity);
  // Antes de renderizar as telas: valores sem moeda explícita são formatados na moeda da cidade
  setLocalCurrency(city.currency);
  const fx: FxContext = useMemo(
    () => ({ code: currency, local: city.currency, rates: live.rates }),
    [currency, city.currency, live.rates],
  );
  // Carteira aberta: a da moeda local quando houver; senão a última usada
  const [walletCurrency, setWalletCurrency] = useState<WalletCurrency>(isWalletCurrency(city.currency) ? city.currency : 'BRL');
  useEffect(() => {
    if (isWalletCurrency(city.currency)) setWalletCurrency(city.currency);
  }, [city.currency]);
  const wallet = wallets[walletCurrency] ?? {};
  const current = history.find((h) => h.id === currentId) ?? null;

  // Aviso no topo da tela para notificações que chegam com o app aberto (não as antigas, nem ao apagar uma)
  const [toast, setToast] = useState<AppNotification | null>(null);
  const newestSeen = useRef(Math.max(0, ...notifications.items.map((n) => n.createdAt)));
  const newest = notifications.items[0];
  useEffect(() => {
    if (!newest || newest.read || newest.createdAt <= newestSeen.current) return;
    newestSeen.current = newest.createdAt;
    setToast(newest);
  }, [newest]);

  // Aviso ao chegar numa cidade nova (não no primeiro carregamento)
  const lastCityId = useRef(city.id);
  useEffect(() => {
    if (lastCityId.current === city.id) return;
    lastCityId.current = city.id;
    notifications.push({ kind: 'city', city: city.name, currency: city.currency });
  }, [city.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Aviso quando a moeda de casa sobe ou cai frente à local (só com cotação real, não a de reserva)
  useEffect(() => {
    if (!live.updatedAt || currency === city.currency) return;
    const pair = `${currency}/${city.currency}`;
    const rate = convert(1, currency, city.currency, live.rates);
    if (!rate) return;
    const base = fxBaseline[pair];
    if (base && Math.abs(((rate - base) / base) * 100) < FX_ALERT_PCT) return;
    setFxBaseline((prev) => ({ ...prev, [pair]: rate }));
    if (base) notifications.push({ kind: 'fx', home: currency, local: city.currency, pct: Math.round(((rate - base) / base) * 1000) / 10 });
  }, [live.updatedAt, currency, city.currency]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tab, currentId]);

  /** Itens fora do catálogo agrupam relatos pelo nome que a IA leu */
  const statsKey = (c: Consultation) =>
    communityKey(c.productId === CUSTOM_PRODUCT_ID ? `custom:${(c.item?.name ?? '').toLowerCase()}` : c.productId, c.cityId);

  const statsFor = (c: Consultation): CommunityStats => {
    const saved = community[statsKey(c)];
    if (saved) return saved;
    const product = findProduct(c.productId);
    // Com preço da IA (ou item fora do catálogo) não inventamos relatos: começa do zero
    return product && !c.ai
      ? initialCommunityStats(product, cityOf(c))
      : { reports: 0, avgPaid: (c.range.fairMin + c.range.fairMax) / 2 };
  };

  const handleVerify = ({ product, price, range, detected, ai }: Verification) => {
    const now = Date.now();
    const consultation: Consultation = {
      id: uid(),
      productId: product?.id ?? CUSTOM_PRODUCT_ID,
      cityId: city.id,
      city,
      currency: city.currency,
      item: detected ?? undefined,
      ai: ai ? { unit: ai.unit, explanation: ai.explanation, tip: ai.tip } : undefined,
      price,
      verdict: getVerdict(price, range),
      range,
      tipIndex: product ? pickTipIndex(product, now) : undefined,
      createdAt: now,
    };
    setHistory((prev) => [consultation, ...prev].slice(0, HISTORY_LIMIT));
    if (consultation.verdict === 'abusive') {
      notifications.push({
        kind: 'gringoTax',
        consultationId: consultation.id,
        productId: consultation.productId,
        itemName: detected?.name,
        overAmount: Math.round((price - range.fairMax) * 100) / 100,
        currency: city.currency,
        city: city.name,
      });
    }
    setCurrentId(consultation.id);
    setTab('result');
  };

  const handleReport = (c: Consultation, paid: number) => {
    const stats = statsFor(c);
    const reports = stats.reports + 1;
    const avgPaid = Math.round(((stats.avgPaid * stats.reports + paid) / reports) * 100) / 100;
    setCommunity((prev) => ({ ...prev, [statsKey(c)]: { reports, avgPaid } }));
    setHistory((prev) => prev.map((h) => (h.id === c.id ? { ...h, paidReported: paid } : h)));
  };

  const handlePay = (c: Consultation) => {
    const requestCurrency = c.currency ?? 'BRL';
    if (isWalletCurrency(requestCurrency)) setWalletCurrency(requestCurrency);
    setCashRequest({
      amount: c.paidReported ?? c.price,
      currency: requestCurrency,
      productId: findProduct(c.productId)?.id,
      itemName: c.item?.name,
    });
    setTab('cash');
  };

  const logWalletTx = (tx: Omit<WalletTx, 'id' | 'createdAt'>) =>
    setWalletTx((prev) => [{ ...tx, id: uid(), createdAt: Date.now() }, ...prev].slice(0, WALLET_TX_LIMIT));

  const setWallet = (next: Wallet) => setWallets((prev) => ({ ...prev, [walletCurrency]: next }));

  const saveWallet = (next: Wallet) => {
    const deltaCents = walletTotal(next) - walletTotal(wallet);
    setWallet(next);
    if (deltaCents !== 0) logWalletTx({ type: 'adjust', currency: walletCurrency, deltaCents });
  };

  const confirmPayment = (pay: Wallet, totalCents: number) => {
    const paidCents = walletTotal(pay);
    const changeCents = paidCents - totalCents;
    const change = piecesToWallet(breakdown(changeCents, walletCurrency));
    setWallet(mergeWallets(mergeWallets(wallet, pay, -1), change, 1));
    logWalletTx({
      type: 'payment',
      currency: walletCurrency,
      productId: cashRequest?.productId,
      itemName: cashRequest?.itemName,
      totalCents,
      paidCents,
      changeCents,
      deltaCents: walletTotal(change) - paidCents,
    });
    notifications.push({ kind: 'payment', currency: walletCurrency, paidCents, changeCents });
    setCashRequest(null);
  };

  const changeTab = (next: Tab) => {
    if (next !== 'cash') setCashRequest(null);
    setTab(next);
  };

  // Sair da conta mantém os dados neste aparelho; apagar fica nas Configurações
  const logout = () => signOut();

  const menuSections: MenuSection[] = [
    {
      title: t('menu.navigate'),
      items: [
        { id: 'scanner', label: t('menu.checkPrice'), icon: ScanLine, onSelect: () => changeTab('scanner'), active: tab === 'scanner' || tab === 'result' },
        { id: 'cash', label: t('menu.myWallet'), icon: WalletIcon, onSelect: () => changeTab('cash'), active: tab === 'cash' },
        { id: 'history', label: t('menu.history'), icon: HistoryIcon, onSelect: () => changeTab('history'), active: tab === 'history' },
      ],
    },
    {
      title: t('menu.accountApp'),
      items: [
        { id: 'home', label: t('menu.home'), icon: Home, onSelect: () => navigate('landing') },
        { id: 'settings', label: t('menu.settings'), icon: Settings, onSelect: () => changeTab('settings'), active: tab === 'settings' },
        { id: 'language', label: t('menu.language'), icon: Languages, onSelect: () => setPicker('language') },
        {
          id: 'notifications',
          label: t('menu.notifications'),
          icon: Bell,
          onSelect: () => changeTab('notifications'),
          active: tab === 'notifications',
          badge: notifications.unread,
        },
        // Sem onSelect = aparece como "Em breve"
        { id: 'help', label: t('menu.help'), icon: LifeBuoy },
        { id: 'terms', label: t('menu.terms'), icon: FileText, onSelect: () => navigate('terms') },
      ],
    },
  ];

  const openConsultation = (c: Consultation) => {
    setCurrentId(c.id);
    setTab('result');
  };

  /** Só no `npm run dev`: um aviso de exemplo de cada tipo, em rodízio */
  const demoIndex = useRef(0);
  const sendDemoNotification = () => {
    const samples: NewNotification[] = [
      { kind: 'gringoTax', consultationId: '', productId: 'coco', overAmount: 8, currency: city.currency, city: city.name },
      { kind: 'city', city: city.name, currency: city.currency },
      { kind: 'fx', home: currency, local: city.currency === currency ? 'BRL' : city.currency, pct: 2.4 },
      { kind: 'payment', currency: walletCurrency, paidCents: 5000, changeCents: 1250 },
      { kind: 'welcome' },
    ];
    notifications.push(samples[demoIndex.current++ % samples.length]);
  };

  /** Tocar numa notificação leva ao lugar dela */
  const openNotification = (n: AppNotification) => {
    if (n.kind === 'payment') changeTab('cash');
    else if (n.kind === 'fx') setPicker('currency');
    else if (n.kind === 'city') setPicker('city');
    else if (n.kind === 'welcome') changeTab('scanner');
    else {
      const consultation = history.find((h) => h.id === n.consultationId);
      if (consultation) openConsultation(consultation);
    }
  };

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-white sm:border-x sm:border-line">
      <Header
        city={city}
        onCityChange={(next) => setCity(withCurrency(next))}
        currency={currency}
        onCurrencyChange={setCurrency}
        rates={live.rates}
        ratesUpdatedAt={live.updatedAt}
        picker={picker}
        onPickerChange={setPicker}
        autoLocate={autoLocate}
        onMenuOpen={() => setMenuOpen(true)}
        unreadNotifications={notifications.unread}
        onNotificationsOpen={() => changeTab('notifications')}
      />

      <main key={tab === 'result' ? `result-${currentId}` : tab} className="flex-1 animate-fade-in px-4 pb-28 pt-5">
        {tab === 'result' && current ? (
          <ResultScreen
            consultation={current}
            fx={fx}
            stats={statsFor(current)}
            onBack={() => setTab('scanner')}
            onPay={() => handlePay(current)}
            onReport={(paid) => handleReport(current, paid)}
          />
        ) : tab === 'cash' ? (
          <WalletScreen
            wallet={wallet}
            currency={walletCurrency}
            onCurrencyChange={setWalletCurrency}
            transactions={walletTx}
            fx={fx}
            request={cashRequest}
            onSaveWallet={saveWallet}
            onConfirmPayment={confirmPayment}
          />
        ) : tab === 'settings' ? (
          <SettingsScreen
            city={city}
            currency={currency}
            autoLocate={autoLocate}
            onAutoLocateChange={setAutoLocate}
            onOpenPicker={setPicker}
            historyCount={history.length}
            walletCents={walletTotal(wallet)}
            walletCurrency={walletCurrency}
            onClearHistory={() => setHistory([])}
            onResetWallet={() => {
              setWallets({});
              setWalletTx([]);
            }}
            onBack={() => changeTab('scanner')}
          />
        ) : tab === 'notifications' ? (
          <NotificationsScreen
            notifications={notifications}
            rates={live.rates}
            onOpen={openNotification}
            onDemo={import.meta.env.DEV ? sendDemoNotification : undefined}
            onBack={() => changeTab('scanner')}
          />
        ) : tab === 'history' ? (
          <HistoryScreen
            history={history}
            fx={fx}
            onOpen={openConsultation}
            onClear={() => setHistory([])}
            onStart={() => setTab('scanner')}
          />
        ) : (
          <ScannerScreen
            city={city}
            fx={fx}
            productId={productId}
            onProductChange={setProductId}
            priceInput={priceInput}
            onPriceChange={setPriceInput}
            onVerify={handleVerify}
          />
        )}
      </main>

      <BottomNav active={tab} onChange={changeTab} />

      <NotificationToast
        toast={toast ? { id: toast.id, ...describeNotification(toast, i18n, live.rates) } : null}
        onOpen={() => {
          if (!toast) return;
          notifications.markRead(toast.id);
          openNotification(toast);
          setToast(null);
        }}
        onClose={() => setToast(null)}
      />

      <AppMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        sections={menuSections}
        account={user ? { name: user.name, email: user.email } : null}
        onSignIn={() => navigate('login')}
        onLogout={() => setConfirmLogout(true)}
      />
      <ConfirmSheet
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title={t('logout.accountTitle')}
        description={t('logout.accountDescription')}
        confirmLabel={t('logout.accountConfirm')}
        onConfirm={logout}
        danger
      />
    </div>
  );
}
