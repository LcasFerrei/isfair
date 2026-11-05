import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, Check, Minus, Pencil, Plus, ShieldAlert } from 'lucide-react';
import { Banknote, Coin, MoneyStack } from '../components/Money';
import { Button } from '../components/ui/Button';
import { MoneyField } from '../components/ui/MoneyField';
import { IconCircle, ListRow, PageTitle, SectionHeading } from '../components/ui/Section';
import { AdSlot } from '../components/AdSlot';
import { CurrencyTabs } from '../components/CurrencyTabs';
import { CUSTOM_EMOJI, findProduct } from '../data/mockData';
import { MONEY, isWalletCurrency } from '../data/money';
import { useI18n } from '../i18n';
import { breakdown, planPayment, toCents, walletCounts, walletPieces, walletTotal } from '../lib/cash';
import { cn } from '../lib/cn';
import { formatMoney, formatDate, formatForeign, isSameCurrency, parseMoney, toInputValue } from '../lib/format';
import type { CashRequest, Denomination, FxContext, Wallet, WalletCurrency, WalletTx } from '../types';

/** Moeda da carteira aberta, disponível para todos os componentes da tela */
const WalletCurrencyContext = createContext<WalletCurrency>('BRL');

function useWalletMoney() {
  const currency = useContext(WalletCurrencyContext);
  return { currency, money: (value: number) => formatMoney(value, currency) };
}

type Mode = 'overview' | 'edit' | 'pay';

/** Guardamos o tipo do aviso, não o texto, para ele acompanhar a troca de idioma */
type Notice = { kind: 'updated' } | { kind: 'paid'; changeCents: number };

interface WalletScreenProps {
  wallet: Wallet;
  /** Moeda da carteira aberta (real, dólar ou euro) */
  currency: WalletCurrency;
  onCurrencyChange: (currency: WalletCurrency) => void;
  transactions: WalletTx[];
  fx: FxContext;
  request: CashRequest | null;
  onSaveWallet: (next: Wallet) => void;
  onConfirmPayment: (pay: Wallet, totalCents: number) => void;
}

export function WalletScreen(props: WalletScreenProps) {
  return (
    <WalletCurrencyContext.Provider value={props.currency}>
      <WalletScreenContent {...props} />
    </WalletCurrencyContext.Provider>
  );
}

function WalletScreenContent({
  wallet,
  currency,
  onCurrencyChange,
  transactions,
  fx,
  request,
  onSaveWallet,
  onConfirmPayment,
}: WalletScreenProps) {
  const { productName } = useI18n();
  // Pagamento vindo de uma consulta: só abre direto se a carteira dessa moeda existir
  const payable = request !== null && request.currency === currency;
  const [mode, setMode] = useState<Mode>(payable ? 'pay' : 'overview');
  const [editReturn, setEditReturn] = useState<Mode>('overview');
  const [totalInput, setTotalInput] = useState(payable && request ? toInputValue(request.amount) : '');
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [mode]);

  const openEdit = (from: Mode) => {
    setEditReturn(from);
    setMode('edit');
  };

  if (mode === 'edit') {
    return (
      <EditWallet
        wallet={wallet}
        onCancel={() => setMode(editReturn)}
        onSave={(next) => {
          onSaveWallet(next);
          setNotice(editReturn === 'overview' ? { kind: 'updated' } : null);
          setMode(editReturn);
        }}
      />
    );
  }

  if (mode === 'pay') {
    const product = findProduct(request?.productId);
    const itemName = request?.itemName ?? (product ? productName(product) : null);
    return (
      <PayView
        wallet={wallet}
        fx={fx}
        label={itemName ? `${product?.emoji ?? CUSTOM_EMOJI} ${itemName}` : undefined}
        totalInput={totalInput}
        onTotalChange={setTotalInput}
        onBack={() => setMode('overview')}
        onEditWallet={() => openEdit('pay')}
        onConfirm={(pay, totalCents) => {
          onConfirmPayment(pay, totalCents);
          setTotalInput('');
          setNotice({ kind: 'paid', changeCents: walletTotal(pay) - totalCents });
          setMode('overview');
        }}
      />
    );
  }

  return (
    <Overview
      wallet={wallet}
      onCurrencyChange={(next) => {
        setNotice(null);
        setTotalInput('');
        onCurrencyChange(next);
      }}
      unsupportedCurrency={request && !isWalletCurrency(request.currency) ? request.currency : null}
      transactions={transactions.filter((tx) => (tx.currency ?? 'BRL') === currency)}
      fx={fx}
      notice={notice}
      onPay={() => {
        setNotice(null);
        setMode('pay');
      }}
      onEdit={() => {
        setNotice(null);
        openEdit('overview');
      }}
    />
  );
}

/* ------------------------------------------------------------------ */

interface OverviewProps {
  wallet: Wallet;
  onCurrencyChange: (currency: WalletCurrency) => void;
  /** Moeda de um pagamento pedido que ainda não tem carteira (ex.: JPY) */
  unsupportedCurrency: string | null;
  transactions: WalletTx[];
  fx: FxContext;
  notice: Notice | null;
  onPay: () => void;
  onEdit: () => void;
}

function Overview({ wallet, onCurrencyChange, unsupportedCurrency, transactions, fx, notice, onPay, onEdit }: OverviewProps) {
  const { t, tp } = useI18n();
  const { currency, money } = useWalletMoney();
  const totalCents = walletTotal(wallet);
  const { notes, coins } = walletCounts(wallet, currency);
  const empty = totalCents === 0;

  const noticeText = !notice
    ? null
    : notice.kind === 'updated'
      ? t('wallet.updated')
      : notice.changeCents > 0
        ? t('wallet.paidWithChange', { change: money(notice.changeCents / 100) })
        : t('wallet.paid');

  return (
    <div>
      <PageTitle title={t('wallet.title')} subtitle={t('wallet.subtitle')} />

      {/* Uma carteira por moeda */}
      <CurrencyTabs value={currency} onChange={onCurrencyChange} label={t('wallet.chooseCurrency')} className="mt-4" />

      {unsupportedCurrency && (
        <p className="mt-4 rounded-lg bg-tourist/15 px-4 py-3 text-sm text-ink">
          {t('wallet.unsupported', { currency: unsupportedCurrency })}
        </p>
      )}

      {noticeText && (
        <p className="mt-4 flex animate-fade-in items-start gap-2 rounded-lg bg-fair/10 px-4 py-3 text-sm font-medium text-fair-text">
          <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={3} /> {noticeText}
        </p>
      )}

      <section className="mt-5 rounded-2xl bg-ink p-5 text-white">
        <p className="text-sm text-white/70">{t('wallet.cash')}</p>
        <p dir="ltr" className="mt-1 text-start text-4xl font-bold tracking-tight tabular-nums">
          {money(totalCents / 100)}
        </p>
        <p className="mt-1 text-sm text-white/70">
          {!isSameCurrency(fx, currency) && <>≈ {formatForeign(totalCents / 100, fx, currency)} · </>}
          {tp('wallet.notes', notes)} · {tp('wallet.coins', coins)}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button className="bg-fair text-ink hover:bg-fair/90" onClick={onPay} disabled={empty}>
            {t('wallet.pay')}
          </Button>
          <Button className="bg-white/10 text-white hover:bg-white/20" onClick={onEdit}>
            {empty ? t('wallet.addMoney') : t('wallet.update')}
          </Button>
        </div>
      </section>

      {empty ? (
        <div className="mt-6 rounded-xl border border-dashed border-line p-4">
          <p className="font-semibold">{t('wallet.emptyTitle')}</p>
          <p className="mt-1 text-sm text-ink-2">{t('wallet.emptyText')}</p>
        </div>
      ) : (
        <section className="mt-8">
          <SectionHeading title={t('wallet.pieces')} />
          <div className="divide-y divide-line">
            {walletPieces(wallet, currency).map(({ denom, count }) => (
              <PieceRow
                key={denom.value}
                denom={denom}
                trailing={
                  <span className="text-end">
                    <span className="block font-semibold tabular-nums">×{count}</span>
                    <span className="block text-sm tabular-nums text-ink-2">
                      {money((toCents(denom.value) * count) / 100)}
                    </span>
                  </span>
                }
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <SectionHeading title={t('wallet.activity')} />
        {transactions.length === 0 ? (
          <p className="text-sm text-ink-2">{t('wallet.noActivity')}</p>
        ) : (
          <div className="divide-y divide-line">
            {transactions.slice(0, 20).map((tx) => (
              <TxRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </section>

      <AdSlot placement="wallet" className="mt-8" />
    </div>
  );
}

function TxRow({ tx }: { tx: WalletTx }) {
  const { t, productName } = useI18n();
  const { money } = useWalletMoney();
  const positive = tx.deltaCents > 0;
  const amount = `${positive ? '+' : '−'} ${money(Math.abs(tx.deltaCents) / 100)}`;
  const amountEl = (
    <span dir="ltr" className={cn('self-center font-semibold tabular-nums', tx.type === 'adjust' && positive && 'text-fair-text')}>
      {amount}
    </span>
  );

  if (tx.type === 'payment') {
    const product = findProduct(tx.productId);
    const itemName = tx.itemName ?? (product ? productName(product) : null);
    return (
      <ListRow
        icon={<IconCircle><ArrowUpRight className="h-5 w-5 rtl:-scale-x-100" /></IconCircle>}
        title={itemName ? `${product?.emoji ?? CUSTOM_EMOJI} ${itemName}` : (tx.label ?? t('wallet.payment'))}
        subtitle={t('wallet.paymentDetail', {
          date: formatDate(tx.createdAt),
          paid: money((tx.paidCents ?? 0) / 100),
          change: money((tx.changeCents ?? 0) / 100),
        })}
        trailing={amountEl}
      />
    );
  }

  return (
    <ListRow
      icon={<IconCircle><Pencil className="h-4 w-4" /></IconCircle>}
      title={t('wallet.adjusted')}
      subtitle={formatDate(tx.createdAt)}
      trailing={amountEl}
    />
  );
}

/* ------------------------------------------------------------------ */

function EditWallet({ wallet, onCancel, onSave }: { wallet: Wallet; onCancel: () => void; onSave: (next: Wallet) => void }) {
  const { t } = useI18n();
  const { currency, money } = useWalletMoney();
  const [draft, setDraft] = useState<Wallet>(wallet);
  const setCount = (value: number, count: number) =>
    setDraft((d) => {
      const next = { ...d };
      if (count > 0) next[value] = count;
      else delete next[value];
      return next;
    });

  // Peso argentino: as moedas quase não circulam e a lista vem vazia
  const renderGroup = (title: string, list: Denomination[]) =>
    list.length > 0 && (
    <section className="mt-6">
      <SectionHeading title={title} />
      <div className="divide-y divide-line">
        {list.map((denom) => (
          <PieceRow
            key={denom.value}
            denom={denom}
            trailing={<Stepper value={draft[denom.value] ?? 0} onChange={(n) => setCount(denom.value, n)} />}
          />
        ))}
      </div>
    </section>
  );

  return (
    <div>
      <BackButton onClick={onCancel} />
      <PageTitle title={t('wallet.editTitle')} subtitle={t('wallet.editSubtitle')} />
      {renderGroup(t('wallet.banknotes'), MONEY[currency].notes)}
      {renderGroup(t('wallet.coinsTitle'), MONEY[currency].coins)}

      <div className="sticky bottom-[64px] -mx-4 mt-6 border-t border-line bg-white px-4 pb-4 pt-3">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-ink-2">{t('wallet.total')}</span>
          <span dir="ltr" className="text-xl font-bold tabular-nums">
            {money(walletTotal(draft) / 100)}
          </span>
        </div>
        <Button size="lg" className="w-full" onClick={() => onSave(draft)}>
          {t('wallet.save')}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

interface PayViewProps {
  wallet: Wallet;
  fx: FxContext;
  label?: string;
  totalInput: string;
  onTotalChange: (value: string) => void;
  onBack: () => void;
  onEditWallet: () => void;
  onConfirm: (pay: Wallet, totalCents: number) => void;
}

function PayView({ wallet, fx, label, totalInput, onTotalChange, onBack, onEditWallet, onConfirm }: PayViewProps) {
  const { t, describePieces } = useI18n();
  const { currency, money } = useWalletMoney();
  const [manual, setManual] = useState<Wallet | null>(null);

  const total = parseMoney(totalInput);
  const totalCents = Number.isFinite(total) && total > 0 ? toCents(total) : 0;
  const balanceCents = walletTotal(wallet);
  const suggested = useMemo(() => planPayment(wallet, totalCents, currency), [wallet, totalCents]);

  const pay = manual ?? suggested;
  const payCents = pay ? walletTotal(pay) : 0;
  const changeCents = payCents - totalCents;
  const change = useMemo(() => (changeCents > 0 ? breakdown(changeCents, currency) : []), [changeCents]);

  const setManualCount = (value: number, count: number) =>
    setManual((m) => {
      const next = { ...(m ?? {}) };
      if (count > 0) next[value] = count;
      else delete next[value];
      return next;
    });

  return (
    <div>
      <BackButton onClick={onBack} />
      <PageTitle title={t('wallet.payTitle')} subtitle={label} />

      <div className="mt-5">
        <MoneyField
          id="total"
          currency={currency}
          label={t('wallet.purchaseTotal')}
          value={totalInput}
          onChange={(v) => {
            onTotalChange(v);
            setManual(null);
          }}
          hint={`${totalCents > 0 && !isSameCurrency(fx, currency) ? `≈ ${formatForeign(total, fx, currency)} · ` : ''}${t('wallet.inWallet', { amount: money(balanceCents / 100) })}`}
        />
      </div>

      {totalCents > 0 && balanceCents < totalCents && (
        <div className="mt-6 rounded-xl bg-abusive/10 p-4">
          <p className="font-semibold text-abusive-text">{t('wallet.insufficient')}</p>
          <p className="mt-1 text-sm text-ink-2">
            {t('wallet.missingCash', { amount: money((totalCents - balanceCents) / 100) })}
          </p>
          <Button size="sm" variant="secondary" className="mt-3 bg-white" onClick={onEditWallet}>
            {t('wallet.updateWallet')}
          </Button>
        </div>
      )}

      {totalCents > 0 && pay && (
        <>
          <section className="mt-6 animate-fade-in overflow-hidden rounded-xl border border-line">
            <div className="p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{t('wallet.handOver')}</span>
                <span dir="ltr" className="text-lg font-bold tabular-nums">
                  {money(payCents / 100)}
                </span>
              </div>
              <p className="text-sm text-ink-2">{manual ? t('wallet.yourChoice') : t('wallet.bestCombo')}</p>
              <div className="mt-3 min-h-9">
                <MoneyStack pieces={walletPieces(pay, currency)} />
              </div>
            </div>
            <div className="border-t border-line bg-muted p-4">
              {changeCents > 0 ? (
                <>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold">{t('wallet.changeDue')}</span>
                    <span className="text-end">
                      <span dir="ltr" className="block text-2xl font-bold tabular-nums text-fair-text">
                        {money(changeCents / 100)}
                      </span>
                      {!isSameCurrency(fx, currency) && <span className="block text-sm text-ink-2">≈ {formatForeign(changeCents / 100, fx, currency)}</span>}
                    </span>
                  </div>
                  <div className="mt-3">
                    <MoneyStack pieces={change} />
                  </div>
                  <p className="mt-3 text-sm text-ink-2">{t('wallet.forExample', { pieces: describePieces(change) })}</p>
                </>
              ) : changeCents === 0 ? (
                <p className="font-semibold text-fair-text">{t('wallet.exact')}</p>
              ) : (
                <p className="font-semibold text-abusive-text">
                  {t('wallet.missingPieces', { amount: money(-changeCents / 100) })}
                </p>
              )}
            </div>
          </section>

          <button
            type="button"
            onClick={() => setManual(manual ? null : { ...(suggested ?? {}) })}
            className="mt-3 text-sm font-semibold underline underline-offset-2"
          >
            {manual ? t('wallet.backToSuggestion') : t('wallet.otherNotes')}
          </button>

          {manual && (
            <section className="mt-2 animate-fade-in divide-y divide-line">
              {walletPieces(wallet, currency).map(({ denom, count }) => (
                <PieceRow
                  key={denom.value}
                  denom={denom}
                  subtitle={t('wallet.youHave', { count })}
                  trailing={
                    <Stepper value={manual[denom.value] ?? 0} max={count} onChange={(n) => setManualCount(denom.value, n)} />
                  }
                />
              ))}
            </section>
          )}

          <div className="mt-5">
            <ListRow
              icon={
                <IconCircle className="bg-tourist">
                  <ShieldAlert className="h-5 w-5" />
                </IconCircle>
              }
              title={t('wallet.checkTitle')}
              subtitle={t('wallet.checkText')}
            />
          </div>

          <Button size="lg" className="mt-5 w-full" disabled={changeCents < 0} onClick={() => onConfirm(pay, totalCents)}>
            {t('wallet.confirmPaid')}
          </Button>
          <p className="mt-2 text-center text-xs text-ink-2">{t('wallet.confirmHint')}</p>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function PieceRow({ denom, subtitle, trailing }: { denom: Denomination; subtitle?: string; trailing: ReactNode }) {
  const { t, noteLabel } = useI18n();
  const { money } = useWalletMoney();
  const fallbackSubtitle =
    denom.kind === 'note'
      ? noteLabel(denom) || t('wallet.banknote')
      : denom.label || t('wallet.coin');
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex w-[100px] shrink-0 justify-center">
        {denom.kind === 'note' ? <Banknote denom={denom} compact /> : <Coin denom={denom} scale={1.4} />}
      </div>
      <div className="min-w-0 flex-1">
        <p dir="ltr" className="text-start font-semibold tabular-nums">
          {money(denom.value)}
        </p>
        <p className="truncate text-sm text-ink-2">
          {subtitle ?? fallbackSubtitle}
        </p>
      </div>
      {trailing}
    </div>
  );
}

function Stepper({ value, onChange, max }: { value: number; onChange: (n: number) => void; max?: number }) {
  const { t } = useI18n();
  const btn = 'grid h-9 w-9 place-items-center rounded-full border border-line transition-colors hover:bg-muted disabled:opacity-30';
  return (
    <div dir="ltr" className="flex shrink-0 items-center gap-1">
      <button type="button" aria-label={t('common.less')} className={btn} disabled={value === 0} onClick={() => onChange(value - 1)}>
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-7 text-center font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        aria-label={t('common.more')}
        className={btn}
        disabled={max !== undefined && value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('common.back')}
      className="-ms-2 mb-2 grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-muted"
    >
      <ArrowLeft className="h-6 w-6 rtl:-scale-x-100" />
    </button>
  );
}
