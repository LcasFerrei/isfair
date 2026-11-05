import { useEffect, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  ChevronDown,
  Coins,
  Globe2,
  Loader2,
  ScanLine,
  Sparkles,
  TrafficCone,
  Users,
  Volume2,
  Wallet as WalletIcon,
  type LucideIcon,
} from 'lucide-react';
import { LanguageSheet } from '../components/LanguageSheet';
import { useAuth } from '../auth/AuthContext';
import { AdSlot } from '../components/AdSlot';
import { Logo } from '../components/Logo';
import { Banknote, Coin } from '../components/Money';
import { PriceRangeBar } from '../components/PriceRangeBar';
import { CountUp, Reveal } from '../components/Reveal';
import { Flag } from '../components/ui/Flag';
import { CURATED_CITIES, DEFAULT_CITY } from '../data/cities';
import { CURRENCIES, PRODUCTS, getCurrency, getProduct } from '../data/mockData';
import { MONEY } from '../data/money';
import { CurrencyTabs } from '../components/CurrencyTabs';
import { LANGUAGES, useI18n, type UiKey } from '../i18n';
import { cn } from '../lib/cn';
import { formatMoney, formatForeign } from '../lib/format';
import { VERDICT_META, getPriceRange, getVerdict } from '../lib/pricing';
import type { WalletCurrency } from '../types';
import { Link } from '../router';

export function Landing() {
  const { t } = useI18n();

  return (
    <div className="min-h-dvh bg-white">
      <LandingHeader />

      <main>
        <Hero />

        {/* Números */}
        <section className="border-y border-line bg-muted/60">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4">
            {[
              { value: LANGUAGES.length, label: t('landing.statLanguages') },
              { value: CURRENCIES.length, label: t('landing.statCurrencies') },
              { value: CURATED_CITIES.length, label: t('landing.statCities') },
              { value: PRODUCTS.length, label: t('landing.statProducts') },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 80} className="text-center">
                <p className="text-4xl font-extrabold tracking-tight tabular-nums">
                  <CountUp to={stat.value} />
                </p>
                <p className="mt-1 text-sm text-ink-2">{stat.label}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <HowItWorks />
        <Features />
        <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
          <AdSlot placement="landing" />
        </div>
        <MoneyShowcase />
        <Languages />
        <Faq />
        <FinalCta />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-ink-2 sm:flex-row sm:px-6">
          <Logo />
          <nav className="flex gap-5">
            <Link to="terms" className="transition-colors hover:text-ink hover:underline">
              {t('landing.terms')}
            </Link>
            <Link to="privacy" className="transition-colors hover:text-ink hover:underline">
              {t('landing.privacy')}
            </Link>
          </nav>
          <p>{t('landing.rights')}</p>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function LandingHeader() {
  const { t, info } = useI18n();
  const { user, ready } = useAuth();
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 bg-white/90 backdrop-blur transition-shadow',
        scrolled ? 'shadow-[0_1px_0_#E6E9EF]' : '',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link to="landing" aria-label="IsFair">
          <Logo />
        </Link>
        <div className="ms-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLangOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-sm font-semibold transition-colors hover:border-ink-3"
            aria-label={t('language.title')}
          >
            <Flag code={info.flag} className="h-3.5" />
            <span className="uppercase">{info.api}</span>
          </button>
          {/* Logado: só "Abrir app" */}
          {ready && !user && (
            <Link
              to="login"
              className="hidden h-9 items-center rounded-full px-3 text-sm font-semibold transition-colors hover:bg-muted sm:flex"
            >
              {t('landing.login')}
            </Link>
          )}
          <Link
            to="app"
            className="flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
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
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden">
      {/* Manchas suaves de cor ao fundo */}
      <div aria-hidden className="pointer-events-none absolute -end-24 -top-24 h-80 w-80 rounded-full bg-fair/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -start-32 top-64 h-72 w-72 rounded-full bg-tourist/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 md:grid-cols-[1.05fr_1fr] md:pb-24 md:pt-16">
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-fair/10 px-3 py-1 text-sm font-semibold text-fair-text">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-fair opacity-60 motion-safe:animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-fair" />
              </span>
              {t('landing.heroBadge')}
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              {t('landing.heroTitle')}
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-5 max-w-xl text-lg text-ink-2">{t('landing.heroSubtitle')}</p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="signup"
                className="group flex h-14 items-center justify-center gap-2 rounded-xl bg-ink px-6 text-lg font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-ink/90 hover:shadow-lg"
              >
                {t('landing.ctaPrimary')}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
              </Link>
              <Link
                to="app"
                className="flex h-14 items-center justify-center rounded-xl bg-muted px-6 text-lg font-semibold transition-all hover:-translate-y-0.5 hover:bg-muted-2"
              >
                {t('landing.ctaSecondary')}
              </Link>
            </div>
            <p className="mt-4 text-sm text-ink-2">{t('landing.heroNote')}</p>
          </Reveal>
        </div>

        <Reveal delay={200} className="relative mx-auto w-full max-w-[320px]">
          <PhoneDemo />
        </Reveal>
      </div>
    </section>
  );
}

const DEMO_STEP_MS = 2800;
const DEMO_ASKED = 15;

/** Celular que mostra o app funcionando: foto → IA analisando → preço justo com veredito. */
function PhoneDemo() {
  const { t, productName } = useI18n();
  const [step, setStep] = useState(0);
  const coco = getProduct('coco');
  const range = getPriceRange(coco, DEFAULT_CITY);
  const verdict = getVerdict(DEMO_ASKED, range);
  const meta = VERDICT_META[verdict];

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStep(2);
      return;
    }
    const id = window.setInterval(() => setStep((s) => (s + 1) % 3), DEMO_STEP_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative">
      {/* Selos flutuando ao redor do celular */}
      <FloatingChip className="-start-10 top-16 hidden sm:flex" delay="0s">
        <span className="h-2.5 w-2.5 rounded-full bg-fair" /> {t('verdict.fair')}
      </FloatingChip>
      <FloatingChip className="-end-12 top-40 hidden sm:flex" delay="1.2s">
        <Volume2 className="h-4 w-4" /> {t('scanner.listen')}
      </FloatingChip>
      <FloatingChip className="-start-6 bottom-20 hidden sm:flex" delay="2.1s">
        <Flag code="US" className="h-3" /> ≈ {formatForeign(DEMO_ASKED, { code: 'USD', local: 'BRL', rates: { BRL: 1, USD: getCurrency('USD').baseRate } })}
      </FloatingChip>

      <div className="rounded-[2.6rem] border-[10px] border-ink bg-white p-3 shadow-2xl shadow-ink/25">
        <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-ink/15" />
        <div className="relative h-[460px] overflow-hidden rounded-[1.6rem] bg-white">
          {/* Foto / captura */}
          <div className="relative h-44 overflow-hidden rounded-2xl bg-muted">
            {step === 0 && (
              <div key="capture" className="absolute inset-0 grid animate-fade-in place-items-center">
                <div className="relative grid h-24 w-24 place-items-center">
                  <span className="pointer-events-none absolute inset-0 rounded-xl border-[3px] border-ink/60 motion-safe:animate-breathe" />
                  <span className="text-5xl">🥥</span>
                </div>
                <span className="absolute bottom-3 flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white">
                  <Camera className="h-3.5 w-3.5" /> {t('scanner.takePhoto')}
                </span>
              </div>
            )}
            {step > 0 && (
              <div key="photo" className="absolute inset-0 grid animate-fade-in place-items-center bg-gradient-to-b from-sky-100 to-amber-100">
                <span className="text-7xl drop-shadow">🥥</span>
                {step === 1 && (
                  <>
                    <div className="absolute inset-0 bg-white/40" />
                    <div className="absolute inset-x-0 top-0 h-full motion-safe:animate-scan-band">
                      <div className="h-1/3 bg-gradient-to-b from-transparent via-fair/40 to-transparent" />
                    </div>
                  </>
                )}
                <span className="absolute start-3 top-3 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold shadow-sm">
                  {step === 1 ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" /> {t('scanner.analyzing')}
                    </>
                  ) : (
                    <>{productName(coco)} · 97%</>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Card do preço justo */}
          <div className={cn('mt-3 rounded-2xl border border-line p-3 transition-all duration-500', step === 2 ? 'opacity-100' : 'translate-y-3 opacity-40')}>
            <p className="flex items-center gap-1.5 text-xs text-ink-2">
              {t('scanner.fairPriceIn', { city: DEFAULT_CITY.name })}
              <span className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-1.5 py-0.5 text-[10px] font-semibold text-ink">
                <Sparkles className="h-2.5 w-2.5" /> IA
              </span>
            </p>
            <p dir="ltr" className="mt-0.5 text-start text-2xl font-bold tracking-tight tabular-nums">
              {formatMoney(range.fairMin, 'BRL')} – {formatMoney(range.fairMax, 'BRL')}
            </p>
            <div className="mt-3 text-[11px] [&_p]:text-[11px]">
              <PriceRangeBar range={range} verdict={step === 2 ? verdict : null} currency="BRL" />
            </div>
            <div dir="ltr" className="mt-3 flex h-10 items-center gap-1.5 rounded-lg bg-muted px-3 text-lg font-bold">
              <span className="text-ink-2">R$</span>
              <span>{step === 2 ? DEMO_ASKED : ''}</span>
              <span className="h-5 w-px bg-ink motion-safe:animate-pulse" />
            </div>
            {step === 2 && (
              <div className="mt-3 flex animate-scale-in items-center gap-2 rounded-xl p-2" style={{ background: `${meta.color}26` }}>
                <span className="grid h-7 w-7 place-items-center rounded-full" style={{ background: meta.color }}>
                  <AlertTriangle className="h-4 w-4 text-ink" strokeWidth={2.5} />
                </span>
                <span className="text-xs font-semibold" style={{ color: meta.text }}>
                  {t(`verdict.${verdict}`)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatingChip({ children, className, delay }: { children: ReactNode; className?: string; delay: string }) {
  return (
    <span
      className={cn(
        'absolute z-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3 py-2 text-sm font-semibold shadow-lg ring-1 ring-line motion-safe:animate-float',
        className,
      )}
      style={{ animationDelay: delay }}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */

function SectionTitle({ title, text }: { title: string; text?: string }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
      {text && <p className="mt-3 text-lg text-ink-2">{text}</p>}
    </Reveal>
  );
}

function HowItWorks() {
  const { t } = useI18n();
  const steps: { icon: LucideIcon; title: UiKey; text: UiKey }[] = [
    { icon: Camera, title: 'landing.step1Title', text: 'landing.step1Text' },
    { icon: TrafficCone, title: 'landing.step2Title', text: 'landing.step2Text' },
    { icon: WalletIcon, title: 'landing.step3Title', text: 'landing.step3Text' },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionTitle title={t('landing.howTitle')} />
      <ol className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <Reveal key={s.title} delay={i * 120}>
            <li className="group relative h-full rounded-2xl border border-line p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
              <span className="absolute end-5 top-5 text-5xl font-extrabold text-muted-2 transition-colors group-hover:text-fair/30">
                {i + 1}
              </span>
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-ink text-white">
                <s.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-xl font-bold">{t(s.title)}</h3>
              <p className="mt-2 text-ink-2">{t(s.text)}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

function Features() {
  const { t } = useI18n();
  const items: { icon: LucideIcon; title: UiKey; text: UiKey; tone: string }[] = [
    { icon: ScanLine, title: 'landing.featureAiTitle', text: 'landing.featureAiText', tone: 'bg-ink text-white' },
    { icon: TrafficCone, title: 'landing.featureTrafficTitle', text: 'landing.featureTrafficText', tone: 'bg-tourist text-ink' },
    { icon: WalletIcon, title: 'landing.featureWalletTitle', text: 'landing.featureWalletText', tone: 'bg-fair text-ink' },
    { icon: Coins, title: 'landing.featureFxTitle', text: 'landing.featureFxText', tone: 'bg-muted text-ink' },
    { icon: Volume2, title: 'landing.featureVoiceTitle', text: 'landing.featureVoiceText', tone: 'bg-muted text-ink' },
    { icon: Users, title: 'landing.featureCommunityTitle', text: 'landing.featureCommunityText', tone: 'bg-muted text-ink' },
  ];
  return (
    <section className="bg-muted/60 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionTitle title={t('landing.featuresTitle')} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 100}>
              <div className="h-full rounded-2xl bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
                <span className={cn('grid h-11 w-11 place-items-center rounded-full', f.tone)}>
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-bold">{t(f.title)}</h3>
                <p className="mt-1.5 text-ink-2">{t(f.text)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Tela de celular (abaixo do breakpoint sm do Tailwind), acompanhando giros e redimensionamento */
function useIsSmallScreen() {
  const query = '(max-width: 639px)';
  const [small, setSmall] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setSmall(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  return small;
}

/** As cédulas da moeda escolhida em leque; ao passar o mouse (ou tocar) elas se abrem. */
function MoneyShowcase() {
  const { t, noteLabel } = useI18n();
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState<WalletCurrency>('BRL');
  const compact = useIsSmallScreen();
  const notes = [...MONEY[currency].notes].reverse();
  const mid = (notes.length - 1) / 2;

  return (
    // grid-cols-1 = minmax(0, 1fr): sem isso a coluna cresce até caber o carrossel inteiro e a página estoura no celular.
    // overflow-x-clip: o leque aberto pode passar das bordas sem criar rolagem lateral.
    <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 overflow-x-clip px-4 py-20 sm:px-6 md:grid-cols-2">
      <Reveal>
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t('landing.moneyTitle')}</h2>
        <p className="mt-3 text-lg text-ink-2">{t('landing.moneyText')}</p>
        <CurrencyTabs value={currency} onChange={setCurrency} label={t('wallet.chooseCurrency')} autoPlay className="mt-6" />
        <div key={currency} className="mt-6 flex animate-fade-in flex-wrap items-end gap-3">
          {MONEY[currency].coins.map((coin) => (
            <span key={coin.value} className="transition-transform hover:-translate-y-1">
              <Coin denom={coin} scale={1.9} />
            </span>
          ))}
        </div>
      </Reveal>

      <Reveal delay={150}>
        {/* A animação de entrada fica no container: nas cédulas ela sobrescreveria o transform do leque */}
        <button
          key={currency}
          type="button"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onClick={() => setOpen((o) => !o)}
          className="relative mx-auto block h-56 w-full max-w-md animate-fade-in sm:h-72"
          aria-label={t('landing.moneyTitle')}
        >
          {notes.map((note, i) => {
            const offset = i - mid;
            // No celular o leque abre menos, para caber na tela
            const spread = compact ? 0.6 : 1;
            const rotate = (open ? offset * 9 : offset * 3) * spread;
            const x = (open ? offset * 34 : offset * 6) * spread;
            const y = (open ? Math.abs(offset) * 10 : 0) * spread;
            return (
              <span
                key={note.value}
                className="absolute left-1/2 top-1/2 block w-44 transition-transform duration-500 ease-out sm:w-56"
                style={{
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${rotate}deg)`,
                  transformOrigin: '50% 140%',
                  zIndex: i,
                }}
                title={[formatMoney(note.value, currency), noteLabel(note)].filter(Boolean).join(' · ')}
              >
                <Banknote denom={note} />
              </span>
            );
          })}
        </button>
      </Reveal>
    </section>
  );
}

function Languages() {
  const { t, setLang, lang } = useI18n();
  return (
    <section className="bg-ink py-20 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Globe2 className="mx-auto h-10 w-10 text-fair" />
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{t('landing.langsTitle')}</h2>
          <p className="mt-3 text-lg text-white/70">{t('landing.langsText')}</p>
        </Reveal>
        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {LANGUAGES.map((l, i) => (
            <Reveal key={l.code} delay={i * 60}>
              <button
                type="button"
                onClick={() => setLang(l.code)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-start transition-all hover:-translate-y-0.5',
                  l.code === lang ? 'bg-fair text-ink' : 'bg-white/10 hover:bg-white/15',
                )}
              >
                <Flag code={l.flag} className="h-4" />
                <bdi dir={l.dir} className="font-semibold">
                  {l.name}
                </bdi>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const { t } = useI18n();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const items: [UiKey, UiKey][] = [
    ['landing.faq1Q', 'landing.faq1A'],
    ['landing.faq2Q', 'landing.faq2A'],
    ['landing.faq3Q', 'landing.faq3A'],
    ['landing.faq4Q', 'landing.faq4A'],
  ];
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <SectionTitle title={t('landing.faqTitle')} />
      <div className="mt-10 divide-y divide-line rounded-2xl border border-line">
        {items.map(([q, a], i) => {
          const open = openIndex === i;
          return (
            <div key={q}>
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : i)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start font-semibold"
              >
                {t(q)}
                <ChevronDown className={cn('h-5 w-5 shrink-0 text-ink-2 transition-transform duration-300', open && 'rotate-180')} />
              </button>
              {/* Altura animada sem medir: grid-rows de 0fr para 1fr */}
              <div className={cn('grid transition-[grid-template-rows] duration-300 ease-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-ink-2">{t(a)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FinalCta() {
  const { t } = useI18n();
  return (
    <section className="px-4 pb-20 sm:px-6">
      <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-ink px-6 py-14 text-center text-white sm:px-12">
        <div aria-hidden className="pointer-events-none absolute -end-16 -top-16 h-56 w-56 rounded-full bg-fair/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 -start-16 h-56 w-56 rounded-full bg-tourist/15 blur-3xl" />
        <h2 className="relative text-3xl font-extrabold tracking-tight sm:text-4xl">{t('landing.finalTitle')}</h2>
        <p className="relative mx-auto mt-3 max-w-xl text-lg text-white/70">{t('landing.finalText')}</p>
        <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="signup"
            className="flex h-14 items-center justify-center rounded-xl bg-fair px-6 text-lg font-semibold text-ink transition-all hover:-translate-y-0.5 hover:bg-fair/90"
          >
            {t('landing.ctaPrimary')}
          </Link>
          <Link
            to="app"
            className="flex h-14 items-center justify-center rounded-xl bg-white/10 px-6 text-lg font-semibold transition-all hover:-translate-y-0.5 hover:bg-white/20"
          >
            {t('landing.ctaSecondary')}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
