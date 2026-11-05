import { useEffect, useState } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { AdSlot } from '../components/AdSlot';
import { CurrencyTabs } from '../components/CurrencyTabs';
import { LanguageSheet } from '../components/LanguageSheet';
import { Logo } from '../components/Logo';
import { Banknote, MoneyStack } from '../components/Money';
import { PriceRangeBar } from '../components/PriceRangeBar';
import { Flag } from '../components/ui/Flag';
import { CURATED_CITIES, getCity } from '../data/cities';
import { PRODUCTS, getProduct } from '../data/mockData';
import { MONEY } from '../data/money';
import { useI18n, type UiKey } from '../i18n';
import { breakdown } from '../lib/cash';
import { cn } from '../lib/cn';
import { formatMoney } from '../lib/format';
import { VERDICT_META, getPriceRange, getVerdict } from '../lib/pricing';
import { Link } from '../router';
import type { WalletCurrency } from '../types';

/*
 * Página inicial 2.0 (prévia em /v2). A versão atual continua em pages/Landing.tsx.
 * Direção: menos "cara de template" — texto alinhado à esquerda, casos concretos com números
 * reais do app (recibo, faixa de preços), sem bolhas desfocadas nem selos flutuando.
 * Os textos ficam aqui em pt e en; os outros idiomas usam o inglês até a versão ser aprovada.
 */

const COPY = {
  pt: {
    navHow: 'Como funciona',
    navMoney: 'Dinheiro',
    navFaq: 'Perguntas',
    heroLine1: 'Pediram {asked} numa água de coco.',
    heroLine2: 'Paga ou negocia?',
    heroText:
      'Tire uma foto. O IsFair mostra quanto aquilo costuma custar na cidade onde você está e quanto troco você deve receber.',
    heroCta: 'Abrir o app',
    heroSecondary: 'Ver como funciona',
    heroNote: 'Grátis e sem cadastro. Funciona em qualquer cidade do mundo.',
    receiptHeader: 'Verificação',
    receiptAsked: 'Pediram',
    receiptFair: 'Preço justo na cidade',
    receiptDiff: 'Acima do justo',
    receiptStamp: 'Gringo Tax',
    receiptTip: 'Dica: peça {ask}. É o teto do preço justo.',
    tickerLabel: 'Faixas de referência do app',
    howTitle: 'Três passos, na fila da barraca.',
    step1Title: 'Fotografe',
    step1Text: 'Produto, etiqueta ou cardápio. A IA reconhece o item e, se o preço estiver escrito, já lê o valor.',
    step2Title: 'Compare',
    step2Text: 'Verde é preço de morador. Amarelo, preço de área turística. Vermelho, cobrança de gringo.',
    step3Title: 'Pague certo',
    step3Text: 'Diga quanto dinheiro tem na carteira. O app escolhe as notas e avisa o troco que você deve receber.',
    step3Pay: 'Você entrega',
    step3Change: 'Troco certo',
    moneyTitle: 'Conheça a nota antes de ela estar na sua mão.',
    moneyText: 'Cédulas de 20 moedas, no tamanho proporcional ao real. Arraste para ver todas.',
    notTitle: 'O que o IsFair não faz',
    not1Title: 'Não garante preço',
    not1Text: 'É uma estimativa. O preço real depende do lugar, da hora e da conversa.',
    not2Title: 'Não mexe no seu dinheiro',
    not2Text: 'Não pede cartão e não faz pagamento. A carteira é só um controle seu.',
    not3Title: 'Não exige cadastro',
    not3Text: 'Dá para usar tudo sem conta. A conta só serve para levar seus dados para outro celular.',
    finalTitle: 'Na próxima compra, confira antes.',
    finalCta: 'Abrir o IsFair',
  },
  en: {
    navHow: 'How it works',
    navMoney: 'Money',
    navFaq: 'FAQ',
    heroLine1: 'They asked {asked} for a coconut.',
    heroLine2: 'Pay or haggle?',
    heroText:
      'Take a photo. IsFair shows what that usually costs in the city you’re in, and how much change you should get back.',
    heroCta: 'Open the app',
    heroSecondary: 'See how it works',
    heroNote: 'Free, no sign-up. Works in any city in the world.',
    receiptHeader: 'Price check',
    receiptAsked: 'Asked',
    receiptFair: 'Fair price in town',
    receiptDiff: 'Above fair',
    receiptStamp: 'Gringo Tax',
    receiptTip: 'Tip: offer {ask}. That’s the top of the fair range.',
    tickerLabel: 'App reference ranges',
    howTitle: 'Three steps, while you’re in line.',
    step1Title: 'Snap',
    step1Text: 'An item, a price tag or a menu. AI recognizes it and, if the price is written, reads it too.',
    step2Title: 'Compare',
    step2Text: 'Green is what locals pay. Yellow is tourist-area pricing. Red is the gringo markup.',
    step3Title: 'Pay right',
    step3Text: 'Tell the app what cash you carry. It picks the notes to hand over and the change you should get.',
    step3Pay: 'You hand over',
    step3Change: 'Correct change',
    moneyTitle: 'Know the note before it’s in your hand.',
    moneyText: 'Banknotes from 20 currencies, drawn to true proportions. Swipe to see them all.',
    notTitle: 'What IsFair doesn’t do',
    not1Title: 'It doesn’t guarantee prices',
    not1Text: 'It’s an estimate. Real prices depend on the place, the time and the conversation.',
    not2Title: 'It doesn’t touch your money',
    not2Text: 'No card, no payments. The wallet is just your own record.',
    not3Title: 'It doesn’t require an account',
    not3Text: 'Everything works without one. An account only carries your data to another phone.',
    finalTitle: 'Next purchase, check first.',
    finalCta: 'Open IsFair',
  },
} as const;

type CopyKey = keyof (typeof COPY)['pt'];

function useCopy() {
  const { lang } = useI18n();
  const dict = lang === 'pt-BR' ? COPY.pt : COPY.en;
  return (key: CopyKey, vars?: Record<string, string>) =>
    Object.entries(vars ?? {}).reduce<string>((text, [k, v]) => text.replace(`{${k}}`, v), dict[key]);
}

/** O caso do recibo: água de coco no Rio, com a faixa real do app */
const DEMO_CITY = getCity('rio');
const DEMO_PRODUCT = getProduct('coco');
const DEMO_ASKED = 25;

export function LandingV2() {
  useEffect(() => {
    // Prévia: fora dos resultados de busca até virar a página oficial
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  return (
    <div className="min-h-dvh bg-white text-ink">
      <Header />
      <main>
        <Hero />
        <Ticker />
        <HowItWorks />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <AdSlot placement="landing" />
        </div>
        <MoneySection />
        <WhatWeDont />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Header() {
  const { info } = useI18n();
  const c = useCopy();
  const { t } = useI18n();
  const { user, ready } = useAuth();
  const [langOpen, setLangOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-ink text-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link to="landingV2" aria-label="IsFair">
          <Logo inverted />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-white/70 md:flex">
          <a href="#como-funciona" className="transition-colors hover:text-white">{c('navHow')}</a>
          <a href="#dinheiro" className="transition-colors hover:text-white">{c('navMoney')}</a>
          <a href="#perguntas" className="transition-colors hover:text-white">{c('navFaq')}</a>
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLangOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={t('language.title')}
          >
            <Flag code={info.flag} className="h-3.5" />
            <span className="uppercase">{info.api}</span>
          </button>
          {ready && !user && (
            <Link to="login" className="hidden h-9 items-center rounded-md px-3 text-sm font-semibold text-white/80 hover:text-white sm:flex">
              {t('landing.login')}
            </Link>
          )}
          <Link
            to="app"
            className="flex h-9 items-center rounded-md bg-white px-4 text-sm font-semibold text-ink transition-colors hover:bg-white/90"
          >
            {t('landing.openApp')}
          </Link>
        </div>
      </div>
      <LanguageSheet open={langOpen} onClose={() => setLangOpen(false)} />
    </header>
  );
}

/* ------------------------------------------------------------------ */

function Hero() {
  const c = useCopy();
  const asked = formatMoney(DEMO_ASKED, 'BRL');

  return (
    <section className="bg-ink text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pb-28 lg:pt-20">
        <div>
          <h1 className="text-[40px] font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            {c('heroLine1', { asked })}
            <span className="mt-2 block text-[#6CFDAE]">{c('heroLine2')}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">{c('heroText')}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              to="app"
              className="inline-flex h-14 items-center gap-2 rounded-md bg-[#6CFDAE] px-7 text-lg font-bold text-ink transition-colors hover:bg-[#8dffc0]"
            >
              {c('heroCta')} <ArrowRight className="h-5 w-5 rtl:-scale-x-100" />
            </Link>
            <a href="#como-funciona" className="font-semibold text-white underline decoration-white/30 underline-offset-[6px] hover:decoration-white">
              {c('heroSecondary')}
            </a>
          </div>
          <p className="mt-6 text-sm text-white/50">{c('heroNote')}</p>
        </div>
        <Receipt />
      </div>
    </section>
  );
}

/** Borda serrilhada de papel de recibo (dentes de 4% de largura e 6 px de altura), em cima e embaixo */
const RECEIPT_EDGE = (() => {
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i <= 25; i++) {
    top.push(`${i * 4}% ${i % 2 ? 0 : 6}px`);
    bottom.push(`${100 - i * 4}% ${i % 2 ? "100%" : "calc(100% - 6px)"}`);
  }
  return `polygon(${[...top, ...bottom].join(", ")})`;
})();

/** Recibo da verificação: o caso do título, com a faixa e o carimbo calculados pelo app */
function Receipt() {
  const c = useCopy();
  const { productName } = useI18n();
  const range = getPriceRange(DEMO_PRODUCT, DEMO_CITY);
  const verdict = getVerdict(DEMO_ASKED, range);
  const money = (v: number) => formatMoney(v, 'BRL');
  const rows: [string, string, boolean?][] = [
    [c('receiptAsked'), money(DEMO_ASKED)],
    [c('receiptFair'), `${money(range.fairMin)} – ${money(range.fairMax)}`],
    [c('receiptDiff'), `+ ${money(DEMO_ASKED - range.fairMax)}`, true],
  ];

  return (
    // drop-shadow (e não box-shadow): acompanha a borda serrilhada recortada
    <div className="relative mx-auto w-full max-w-sm drop-shadow-[0_24px_32px_rgba(0,0,0,0.45)] lg:ms-auto">
      {/* Borda serrilhada de papel de recibo, em cima e embaixo */}
      <div className="relative bg-white px-6 pb-8 pt-7 text-ink" style={{ clipPath: RECEIPT_EDGE }}>
        <div className="flex items-baseline justify-between font-mono text-xs uppercase tracking-widest text-ink-3">
          <span>IsFair · {c('receiptHeader')}</span>
          <span>{DEMO_CITY.name}</span>
        </div>
        <p className="mt-5 text-xl font-bold">{productName(DEMO_PRODUCT)}</p>
        <dl className="mt-4 space-y-2.5 border-y border-dashed border-ink/25 py-4 font-mono text-sm">
          {rows.map(([label, value, strong]) => (
            <div key={label} className="flex items-baseline gap-2">
              <dt className="shrink-0 text-ink-2">{label}</dt>
              <span aria-hidden className="mb-1 flex-1 border-b border-dotted border-ink/25" />
              <dd dir="ltr" className={cn('shrink-0 tabular-nums', strong && 'font-bold text-abusive-text')}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 text-[11px] [&_p]:text-[11px]">
          <PriceRangeBar range={range} verdict={verdict} currency="BRL" />
        </div>
        <p className="mt-5 text-sm text-ink-2">{c('receiptTip', { ask: money(range.fairMax) })}</p>

        {/* Carimbo */}
        <span
          className="absolute end-5 top-16 rotate-[-12deg] rounded-sm border-[3px] px-2 py-0.5 font-mono text-sm font-bold uppercase tracking-widest opacity-90"
          style={{ borderColor: VERDICT_META[verdict].text, color: VERDICT_META[verdict].text }}
        >
          {c('receiptStamp')}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Faixa com preços de referência reais do app, de várias cidades */
function Ticker() {
  const c = useCopy();
  const { productShort } = useI18n();
  const cities = CURATED_CITIES.slice(0, 8);
  const items = PRODUCTS.filter((p) => p.quick).map((p, i) => {
    const city = cities[i % cities.length];
    const r = getPriceRange(p, city);
    return { key: `${p.id}-${city.id}`, text: `${productShort(p)} · ${city.name}`, price: `R$ ${r.fairMin}–${r.fairMax}` };
  });

  return (
    <section aria-label={c('tickerLabel')} className="overflow-hidden border-b border-line bg-white py-4">
      <div className="flex w-max motion-safe:animate-marquee hover:[animation-play-state:paused]">
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy > 0 || undefined} className="flex shrink-0 items-center">
            {items.map((item) => (
              <li key={item.key} className="flex items-center gap-2 whitespace-nowrap px-6 text-sm">
                <span className="text-ink-2">{item.text}</span>
                <span dir="ltr" className="font-mono font-semibold tabular-nums">{item.price}</span>
                <span aria-hidden className="ms-6 h-1 w-1 rounded-full bg-ink/20" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function HowItWorks() {
  const c = useCopy();
  const range = getPriceRange(DEMO_PRODUCT, DEMO_CITY);
  const note20 = MONEY.BRL.notes.find((n) => n.value === 20)!;
  // Compra de R$ 12 paga com uma nota de 20: o troco certo é R$ 8
  const change = breakdown(800, 'BRL');

  const steps: { n: string; title: CopyKey; text: CopyKey; visual: JSX.Element }[] = [
    {
      n: '01',
      title: 'step1Title',
      text: 'step1Text',
      visual: (
        <div className="grid aspect-[4/3] place-items-center rounded-lg bg-muted">
          <div className="relative grid h-28 w-28 place-items-center">
            <span className="absolute inset-0 rounded-xl border-[3px] border-ink/70" />
            <span className="text-6xl">{DEMO_PRODUCT.emoji}</span>
          </div>
        </div>
      ),
    },
    {
      n: '02',
      title: 'step2Title',
      text: 'step2Text',
      visual: (
        <div className="grid aspect-[4/3] content-center rounded-lg bg-muted px-6">
          <PriceRangeBar range={range} verdict={null} currency="BRL" />
        </div>
      ),
    },
    {
      n: '03',
      title: 'step3Title',
      text: 'step3Text',
      visual: (
        <div className="grid aspect-[4/3] content-center gap-4 rounded-lg bg-muted px-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-3">{c('step3Pay')}</p>
            <MoneyStack pieces={[{ denom: note20, count: 1 }]} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-3">{c('step3Change')}</p>
            <MoneyStack pieces={change} />
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28">
      <h2 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{c('howTitle')}</h2>
      <ol className="mt-14 grid gap-12 md:grid-cols-3 md:gap-8">
        {steps.map((s) => (
          <li key={s.n} className="border-t-2 border-ink pt-5">
            <span className="font-mono text-sm font-bold text-ink-3">{s.n}</span>
            <h3 className="mt-2 text-2xl font-bold">{c(s.title)}</h3>
            <p className="mt-2 leading-relaxed text-ink-2">{c(s.text)}</p>
            <div className="mt-6">{s.visual}</div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ */

/** Cédulas da moeda escolhida lado a lado, em escala real entre si */
function MoneySection() {
  const c = useCopy();
  const { noteLabel } = useI18n();
  const { t } = useI18n();
  const [currency, setCurrency] = useState<WalletCurrency>('BRL');
  const notes = MONEY[currency].notes;
  const widest = Math.max(...notes.map((n) => n.size[0]));

  return (
    <section id="dinheiro" className="scroll-mt-20 bg-muted/70 py-20 lg:py-28">
      <div className="mx-auto grid max-w-6xl grid-cols-1 px-4 sm:px-6">
        <h2 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{c('moneyTitle')}</h2>
        <p className="mt-4 max-w-xl text-lg text-ink-2">{c('moneyText')}</p>
        <CurrencyTabs value={currency} onChange={setCurrency} label={t('wallet.chooseCurrency')} className="mt-8" />
        <ul key={currency} className="no-scrollbar -mx-4 mt-8 flex animate-fade-in items-end gap-5 overflow-x-auto px-4 pb-2">
          {notes.map((note) => (
            // Largura proporcional ao tamanho real: a maior nota da moeda mede 260 px
            <li key={note.value} className="shrink-0" style={{ width: `${(note.size[0] / widest) * 260}px` }}>
              <Banknote denom={note} />
              <p className="mt-2 text-sm font-semibold">{formatMoney(note.value, currency)}</p>
              {noteLabel(note) && <p className="text-xs text-ink-2">{noteLabel(note)}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function WhatWeDont() {
  const c = useCopy();
  const items: [CopyKey, CopyKey][] = [
    ['not1Title', 'not1Text'],
    ['not2Title', 'not2Text'],
    ['not3Title', 'not3Text'],
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{c('notTitle')}</h2>
      <ul className="mt-12 grid gap-10 md:grid-cols-3">
        {items.map(([title, text]) => (
          <li key={title}>
            <span className="grid h-9 w-9 place-items-center rounded-md bg-abusive/10 text-abusive-text">
              <X className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <h3 className="mt-4 text-xl font-bold">{c(title)}</h3>
            <p className="mt-2 leading-relaxed text-ink-2">{c(text)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ */

/** Perguntas já traduzidas nos 8 idiomas (as mesmas da página atual), em lista aberta */
function Faq() {
  const { t } = useI18n();
  const items: [UiKey, UiKey][] = [
    ['landing.faq1Q', 'landing.faq1A'],
    ['landing.faq2Q', 'landing.faq2A'],
    ['landing.faq3Q', 'landing.faq3A'],
    ['landing.faq4Q', 'landing.faq4A'],
  ];
  return (
    <section id="perguntas" className="scroll-mt-20 border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_2fr] lg:py-28">
        <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{t('landing.faqTitle')}</h2>
        <dl className="divide-y divide-line border-y border-line">
          {items.map(([q, a]) => (
            <div key={q} className="py-6">
              <dt className="flex items-start gap-3 text-lg font-bold">
                <Check className="mt-1 h-5 w-5 shrink-0 text-fair" strokeWidth={3} />
                {t(q)}
              </dt>
              <dd className="mt-2 ps-8 leading-relaxed text-ink-2">{t(a)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function FinalCta() {
  const c = useCopy();
  return (
    <section className="bg-ink text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-4 py-16 sm:px-6 md:flex-row md:items-center">
        <h2 className="max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">{c('finalTitle')}</h2>
        <Link
          to="app"
          className="inline-flex h-14 shrink-0 items-center gap-2 rounded-md bg-[#6CFDAE] px-7 text-lg font-bold text-ink transition-colors hover:bg-[#8dffc0]"
        >
          {c('finalCta')} <ArrowRight className="h-5 w-5 rtl:-scale-x-100" />
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="bg-ink text-white/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 border-t border-white/10 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Logo inverted />
        <nav className="flex gap-5">
          <Link to="terms" className="hover:text-white">{t('landing.terms')}</Link>
          <Link to="privacy" className="hover:text-white">{t('landing.privacy')}</Link>
        </nav>
        <p>{t('landing.rights')}</p>
      </div>
    </footer>
  );
}
