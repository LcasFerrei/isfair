import { useEffect, useRef, useState, type ChangeEvent, type RefObject } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ImageUp,
  Loader2,
  RotateCcw,
  ScanText,
  ShieldAlert,
  Sparkles,
  Volume2,
  type LucideIcon,
} from 'lucide-react';
import { AdSlot } from '../components/AdSlot';
import { CityBadge } from '../components/CityPicker';
import { GoogleLink, ItemThumb, PhotoCredit } from '../components/DetectedItem';
import { PriceRangeBar } from '../components/PriceRangeBar';
import { Button } from '../components/ui/Button';
import { MoneyField } from '../components/ui/MoneyField';
import { PageTitle, SectionHeading } from '../components/ui/Section';
import { CUSTOM_EMOJI, PRODUCTS, getProduct } from '../data/mockData';
import { useI18n, type UiKey } from '../i18n';
import { cn } from '../lib/cn';
import { cacheEstimate, cityContext, getCachedEstimate, requestEstimate } from '../lib/estimate';
import { formatMoney, formatForeign, isSameCurrency, parseMoney, toInputValue } from '../lib/format';
import { identifyPhoto, type IdentifyFailure } from '../lib/identify';
import { VERDICT_META, examplePrice, getPriceRange, getVerdict } from '../lib/pricing';
import type { City, DetectedItem, FxContext, PriceEstimate, PriceRange, Product, ProductCategory, VerdictLevel } from '../types';

/** O que a tela de resultado precisa para registrar a consulta */
export interface Verification {
  /** null quando o item não está no catálogo (preço só da IA) */
  product: Product | null;
  price: number;
  range: PriceRange;
  detected: DetectedItem | null;
  /** Estimativa da IA usada; null quando caiu no valor de referência do catálogo */
  ai: PriceEstimate | null;
}

type EstimateState = { key: string; status: 'loading' | 'error' } | { key: string; status: 'ready'; data: PriceEstimate };

type ScanPhase = 'idle' | 'scanning' | 'done';

/** Guardamos o motivo, não o texto, para a mensagem acompanhar a troca de idioma */
type ScanMessage = { kind: 'notRecognized'; description: string } | { kind: 'error'; code: IdentifyFailure };

/** Abas do "Teste rápido": populares + uma por categoria de produto */
type CatalogTab = 'popular' | ProductCategory;
const CATALOG_TABS: CatalogTab[] = ['popular', 'food', 'drinks', 'beach', 'souvenirs'];

const VERDICT_ICONS: Record<VerdictLevel, LucideIcon> = {
  fair: CheckCircle2,
  tourist: AlertTriangle,
  abusive: ShieldAlert,
};

interface ScannerScreenProps {
  city: City;
  fx: FxContext;
  productId: string | null;
  onProductChange: (id: string | null) => void;
  priceInput: string;
  onPriceChange: (value: string) => void;
  onVerify: (verification: Verification) => void;
}

/**
 * Fluxo: foto → a IA identifica o produto (e lê o preço, se houver etiqueta) → logo abaixo da foto
 * aparece o preço justo da cidade; digitar o valor pedido mostra o veredito na hora.
 */
export function ScannerScreen({
  city,
  fx,
  productId,
  onProductChange,
  priceInput,
  onPriceChange,
  onVerify,
}: ScannerScreenProps) {
  const { t, info, productName, productShort, productUnit } = useI18n();
  const [phase, setPhase] = useState<ScanPhase>(productId ? 'done' : 'idle');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [scanMessage, setScanMessage] = useState<ScanMessage | null>(null);
  const [priceFromPhoto, setPriceFromPhoto] = useState(false);
  const [catalogTab, setCatalogTab] = useState<CatalogTab>('popular');
  const [detected, setDetected] = useState<DetectedItem | null>(null);
  /** Incrementado a cada nova foto/seleção para descartar respostas atrasadas da IA */
  const scanId = useRef(0);
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLElement>(null);

  const product = productId ? getProduct(productId) : null;
  // Os preços de exemplo e as faixas de referência do catálogo são em reais: só valem no Brasil
  const inBrazil = city.currency === 'BRL';
  const catalog = inBrazil ? PRODUCTS : PRODUCTS.filter((p) => p.global);

  // Preço justo vem da IA: para o item exato da foto ou, nos exemplos, para o produto do catálogo.
  // Fora do Brasil o nome em inglês evita a IA pensar no item brasileiro ("água de coco" de praia carioca).
  const estimateItem = detected?.name ?? (product ? (inBrazil ? product.name : product.nameEn) : null);
  const estimateKey = estimateItem ? `${estimateItem}|${city.id}|${info.api}` : null;
  const [estimateState, setEstimateState] = useState<EstimateState | null>(null);

  useEffect(() => {
    if (!estimateItem || !estimateKey || phase !== 'done') return;
    const cached = getCachedEstimate(estimateItem, city, info.api);
    if (cached) {
      setEstimateState({ key: estimateKey, status: 'ready', data: cached });
      return;
    }
    const controller = new AbortController();
    setEstimateState({ key: estimateKey, status: 'loading' });
    requestEstimate(estimateItem, city, info.api, controller.signal)
      .then((data) => setEstimateState({ key: estimateKey, status: 'ready', data }))
      .catch((error: Error) => {
        if (error.name !== 'AbortError') setEstimateState({ key: estimateKey, status: 'error' });
      });
    return () => controller.abort();
    // city e estimateItem já estão em estimateKey
  }, [estimateKey, phase]);

  const estimate: EstimateState | null =
    estimateKey && estimateState?.key === estimateKey ? estimateState : estimateKey ? { key: estimateKey, status: 'loading' } : null;

  useEffect(
    () => () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    },
    [photoUrl],
  );

  /** Leva o card do preço justo para a vista (no celular a foto ocupa a tela). */
  const revealCard = () =>
    window.setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);

  const startScan = async (file: File) => {
    const id = ++scanId.current;
    setPhotoUrl(URL.createObjectURL(file));
    setConfidence(null);
    setScanMessage(null);
    setPriceFromPhoto(false);
    setDetected(null);
    setPhase('scanning');
    onProductChange(null);
    onPriceChange('');
    try {
      const result = await identifyPhoto(file, info.api, cityContext(city));
      if (id !== scanId.current) return;
      // A estimativa veio junto com a identificação: guarda para o card usar sem nova chamada
      if (result.itemName && result.estimate) cacheEstimate(result.itemName, city, info.api, result.estimate);
      setDetected(result.itemName ? { name: result.itemName, image: result.itemImage } : null);
      if (result.productId || result.itemName) {
        onProductChange(result.productId);
        setConfidence(Math.round(result.confidence * 100));
        if (result.priceSeen) {
          onPriceChange(toInputValue(result.priceSeen));
          setPriceFromPhoto(true);
        }
        revealCard();
      } else {
        setScanMessage({ kind: 'notRecognized', description: result.description });
      }
    } catch (error) {
      if (id !== scanId.current) return;
      setScanMessage({ kind: 'error', code: (error as Error).message as IdentifyFailure });
    }
    setPhase('done');
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void startScan(file);
    e.target.value = '';
  };

  const clearScan = () => {
    scanId.current++;
    setPhotoUrl(null);
    setConfidence(null);
    setScanMessage(null);
    setPriceFromPhoto(false);
    setDetected(null);
  };

  const selectProduct = (p: Product, withExamplePrice: boolean) => {
    clearScan();
    setPhase('done');
    onProductChange(p.id);
    onPriceChange(withExamplePrice && inBrazil ? toInputValue(examplePrice(p, city)) : '');
    revealCard();
  };

  const reset = () => {
    clearScan();
    setPhase('idle');
    onProductChange(null);
    onPriceChange('');
  };

  const scanMessageText = !scanMessage
    ? null
    : scanMessage.kind === 'error'
      ? t(`identify.${scanMessage.code}` as UiKey)
      : scanMessage.description
        ? t('scanner.notRecognizedDesc', { description: scanMessage.description })
        : t('scanner.notRecognized');

  return (
    <div>
      <PageTitle title={t('scanner.title')} subtitle={t('scanner.subtitle')} />

      <div className="mt-5">
        {photoUrl ? (
          <PhotoPanel
            photoUrl={photoUrl}
            scanning={phase === 'scanning'}
            label={
              phase === 'scanning'
                ? null
                : detected || product
                  ? `${detected?.name ?? productName(product!)}${confidence !== null ? ` · ${confidence}%` : ''}`
                  : t('scanner.notIdentified')
            }
            onRetake={() => cameraInput.current?.click()}
            onClear={reset}
          />
        ) : (
          <CapturePanel
            compact={Boolean(product || detected)}
            onCamera={() => cameraInput.current?.click()}
            onGallery={() => galleryInput.current?.click()}
          />
        )}
      </div>
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      <input ref={galleryInput} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {scanMessage && (
        <p
          className={cn(
            'mt-3 animate-fade-in rounded-lg px-4 py-3 text-sm font-medium',
            scanMessage.kind === 'error' ? 'bg-abusive/10 text-abusive-text' : 'bg-muted text-ink-2',
          )}
        >
          {scanMessageText}
        </p>
      )}

      {(product || detected) && estimate && phase === 'done' && (
        <FairPriceCard
          sectionRef={cardRef}
          product={product}
          estimate={estimate}
          city={city}
          fx={fx}
          priceInput={priceInput}
          onPriceChange={(value) => {
            setPriceFromPhoto(false);
            onPriceChange(value);
          }}
          priceFromPhoto={priceFromPhoto}
          detected={detected}
          onVerify={onVerify}
        />
      )}

      {/* Exemplos / outro produto */}
      <section className="mt-8">
        <SectionHeading
          title={product || detected ? t('scanner.otherProduct') : t('scanner.quickTitle')}
          subtitle={product || detected ? undefined : t('scanner.quickSubtitle')}
        />
        <div role="tablist" className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
          {CATALOG_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={catalogTab === tab}
              onClick={() => setCatalogTab(tab)}
              className={cn(
                'h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors',
                catalogTab === tab ? 'bg-ink text-white' : 'bg-muted hover:bg-muted-2',
              )}
            >
              {t(`category.${tab}`)}
            </button>
          ))}
        </div>
        <div key={catalogTab} className="grid animate-fade-in grid-cols-2 gap-2">
          {catalog.filter((p) => (catalogTab === 'popular' ? p.quick : p.category === catalogTab)).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectProduct(p, true)}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-3 text-start transition-colors',
                productId === p.id ? 'border-ink bg-muted' : 'border-line hover:bg-muted',
              )}
            >
              <span className="text-[28px] leading-none">{p.emoji}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{productShort(p)}</span>
                <span className="block truncate text-xs text-ink-2">
                  {inBrazil ? t('scanner.asked', { price: formatMoney(examplePrice(p, city)) }) : productUnit(p)}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <AdSlot placement="scanner" className="mt-8" />
    </div>
  );
}

/* ------------------------------------------------------------------ */

const CYCLE_EMOJIS = PRODUCTS.map((p) => p.emoji);
const CYCLE_MS = 1800;

/** Antes da foto: card claro com um quadro de foco que "respira" e produtos se alternando. */
function CapturePanel({ compact, onCamera, onGallery }: { compact: boolean; onCamera: () => void; onGallery: () => void }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (compact || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % CYCLE_EMOJIS.length), CYCLE_MS);
    return () => window.clearInterval(id);
  }, [compact]);

  return (
    <section className={cn('rounded-2xl bg-muted text-center', compact ? 'p-4' : 'px-5 pb-5 pt-7')}>
      {!compact && (
        <>
          <div className="relative mx-auto grid h-28 w-28 place-items-center">
            <FocusCorners />
            <span key={index} className="text-5xl motion-safe:animate-emoji-in" aria-hidden>
              {CYCLE_EMOJIS[index]}
            </span>
          </div>
          <p className="mt-4 text-lg font-semibold">{t('scanner.idleTitle')}</p>
          <p className="mx-auto mt-1 max-w-[280px] text-sm text-ink-2">{t('scanner.idleHint')}</p>
        </>
      )}
      {compact && <p className="text-sm font-medium text-ink-2">{t('scanner.newPhoto')}</p>}
      <div className={cn('flex gap-2', compact ? 'mt-3' : 'mt-5')}>
        <Button size={compact ? 'md' : 'lg'} className="flex-1" onClick={onCamera}>
          <Camera className="h-5 w-5" /> {t('scanner.takePhoto')}
        </Button>
        <Button size={compact ? 'md' : 'lg'} variant="secondary" className="bg-white hover:bg-white/70" onClick={onGallery} aria-label={t('scanner.gallery')}>
          <ImageUp className="h-5 w-5" />
          <span className="max-[360px]:hidden">{t('scanner.fromGallery')}</span>
        </Button>
      </div>
    </section>
  );
}

function FocusCorners() {
  const corner = 'absolute h-6 w-6 border-ink/70';
  return (
    <div className="pointer-events-none absolute inset-0 motion-safe:animate-breathe" aria-hidden>
      <span className={cn(corner, 'left-0 top-0 rounded-tl-xl border-l-[3px] border-t-[3px]')} />
      <span className={cn(corner, 'right-0 top-0 rounded-tr-xl border-r-[3px] border-t-[3px]')} />
      <span className={cn(corner, 'bottom-0 left-0 rounded-bl-xl border-b-[3px] border-l-[3px]')} />
      <span className={cn(corner, 'bottom-0 right-0 rounded-br-xl border-b-[3px] border-r-[3px]')} />
    </div>
  );
}

interface PhotoPanelProps {
  photoUrl: string;
  scanning: boolean;
  /** Produto identificado (ou "não identificado"); null enquanto analisa */
  label: string | null;
  onRetake: () => void;
  onClear: () => void;
}

/** A foto em tamanho moderado: durante a análise, véu claro e uma faixa suave passando. */
function PhotoPanel({ photoUrl, scanning, label, onRetake, onClear }: PhotoPanelProps) {
  const { t } = useI18n();
  return (
    <section className="relative h-56 animate-fade-in overflow-hidden rounded-2xl bg-muted">
      <img src={photoUrl} alt={t('scanner.photoAlt')} className="h-full w-full object-cover" />

      {scanning && (
        <>
          <div className="absolute inset-0 bg-white/40" />
          <div className="absolute inset-x-0 top-0 h-full motion-safe:animate-scan-band">
            <div className="h-1/3 bg-gradient-to-b from-transparent via-fair/35 to-transparent" />
          </div>
        </>
      )}

      <div className="absolute start-3 top-3">
        <span className="flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-sm font-semibold shadow-sm">
          {scanning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> {t('scanner.analyzing')}
            </>
          ) : (
            label
          )}
        </span>
      </div>

      {!scanning && (
        <div className="absolute bottom-3 end-3 flex gap-2">
          <button
            type="button"
            onClick={onRetake}
            aria-label={t('scanner.retake')}
            title={t('scanner.retake')}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/95 shadow-sm transition-colors hover:bg-white"
          >
            <Camera className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onClear}
            aria-label={t('common.clear')}
            title={t('common.clear')}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/95 shadow-sm transition-colors hover:bg-white"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */

interface FairPriceCardProps {
  /** Não pode se chamar `ref`: no React 18 essa prop não chega ao componente */
  sectionRef: RefObject<HTMLElement>;
  /** null para itens fora do catálogo (preço só da IA) */
  product: Product | null;
  estimate: EstimateState;
  city: City;
  fx: FxContext;
  priceInput: string;
  onPriceChange: (value: string) => void;
  priceFromPhoto: boolean;
  /** O item exato que a IA viu (ex.: "Club Social Integral"), com foto da internet se houver */
  detected: DetectedItem | null;
  onVerify: (verification: Verification) => void;
}

/** Voz do aparelho no idioma do app (grátis, sem servidor). */
function speak(text: string, lang: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  window.speechSynthesis.speak(utterance);
}

/**
 * Preço justo estimado pela IA para o item na cidade + veredito ao vivo do valor pedido.
 * Se a IA falhar e o item for do catálogo, usa a faixa de referência do app (com aviso).
 */
function FairPriceCard({
  sectionRef,
  product,
  estimate,
  city,
  fx,
  priceInput,
  onPriceChange,
  priceFromPhoto,
  detected,
  onVerify,
}: FairPriceCardProps) {
  const { t, lang, info, productName, productUnit } = useI18n();
  const ai = estimate.status === 'ready' ? estimate.data : null;
  const fallback = estimate.status === 'error' && product && city.currency === 'BRL' ? getPriceRange(product, city) : null;
  const range = ai?.range ?? fallback;
  const price = parseMoney(priceInput);
  const validPrice = Number.isFinite(price) && price > 0;
  const verdict = validPrice && range ? getVerdict(price, range) : null;

  const name = detected?.name ?? (product ? productName(product) : '');
  const unit = ai?.unit || (product ? productUnit(product) : '');
  const subtitle = [
    unit,
    lang !== 'pt-BR' && product && !detected && city.currency === 'BRL' ? t('scanner.ptName', { name: product.name }) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const speakSummary = () => {
    if (!range) return;
    const parts = [t('scanner.speakRange', { item: name, city: city.name, min: formatMoney(range.fairMin), max: formatMoney(range.fairMax) })];
    if (verdict) {
      const over = price - range.fairMax;
      parts.push(
        `${t(`verdict.${verdict}`)}. ${
          verdict === 'fair'
            ? t('scanner.liveFair')
            : t('scanner.liveAbove', { amount: formatMoney(over), pct: Math.round((over / range.fairMax) * 100) })
        }`,
      );
    }
    if (ai?.explanation) parts.push(ai.explanation);
    // "ar-u-nu-latn" é só para números; para a voz basta o idioma
    speak(parts.join(' '), info.code === 'ar' ? 'ar-SA' : info.intl);
  };

  return (
    <section ref={sectionRef} className="mt-4 scroll-mt-40 animate-fade-in rounded-2xl border border-line p-4">
      <div className="flex items-center gap-3">
        <ItemThumb
          image={detected?.image}
          emoji={product?.emoji ?? CUSTOM_EMOJI}
          className={detected?.image ? 'h-16 w-16' : undefined}
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{name}</p>
          {subtitle && <p className="text-sm text-ink-2">{subtitle}</p>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <GoogleLink query={detected?.name ?? (product && city.currency !== 'BRL' ? product.nameEn : product?.name) ?? name} />
        {range && 'speechSynthesis' in window && (
          <button
            type="button"
            onClick={speakSummary}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-muted px-3 text-sm font-medium transition-colors hover:bg-muted-2"
          >
            <Volume2 className="h-4 w-4 rtl:-scale-x-100" /> {t('scanner.listen')}
          </button>
        )}
        {detected?.image && <PhotoCredit image={detected.image} />}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-ink-2">
        {t('scanner.fairPriceIn', { city: city.name })}
        {ai ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2 py-0.5 text-xs font-semibold text-ink">
            <Sparkles className="h-3 w-3" /> {t('scanner.aiEstimate')}
          </span>
        ) : (
          fallback && <CityBadge city={city} />
        )}
      </div>

      {estimate.status === 'loading' && (
        <div className="mt-2 animate-fade-in" aria-busy="true">
          <div className="h-9 w-56 animate-pulse rounded-lg bg-muted" />
          <p className="mt-2 flex items-center gap-2 text-sm text-ink-2">
            <Loader2 className="h-4 w-4 animate-spin" /> {t('scanner.aiEstimating')}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-1.5 animate-pulse rounded-full bg-muted-2" />
            ))}
          </div>
        </div>
      )}

      {estimate.status === 'error' && !range && (
        <p className="mt-2 rounded-lg bg-muted px-4 py-3 text-sm text-ink-2">{t('scanner.aiCouldNotEstimate')}</p>
      )}

      {range && (
        <>
          <p dir="ltr" className="mt-1 animate-fade-in text-start text-3xl font-bold tracking-tight tabular-nums">
            {formatMoney(range.fairMin)} – {formatMoney(range.fairMax)}
          </p>
          {!isSameCurrency(fx) && (
            <p className="text-sm text-ink-2">
              ≈ {formatForeign(range.fairMin, fx)} – {formatForeign(range.fairMax, fx)}
            </p>
          )}
          {ai?.explanation && <p className="mt-2 text-sm text-ink-2">{ai.explanation}</p>}
          {fallback && <p className="mt-2 text-xs text-ink-2">{t('scanner.aiFallback')}</p>}

          <div className="mt-4">
            <PriceRangeBar range={range} verdict={verdict} currency={city.currency} />
          </div>
        </>
      )}

      {range && <div className="mt-5 border-t border-line pt-4">
        <MoneyField
          id="price"
          currency={city.currency}
          label={t('scanner.askedQuestion')}
          value={priceInput}
          onChange={onPriceChange}
          hint={
            priceFromPhoto ? (
              <span className="flex items-start gap-1.5 font-medium text-ink">
                <ScanText className="mt-0.5 h-4 w-4 shrink-0" /> {t('scanner.priceFromPhoto')}
              </span>
            ) : validPrice ? (
              isSameCurrency(fx) ? undefined : `≈ ${formatForeign(price, fx)}`
            ) : (
              t('scanner.enterAskedHint')
            )
          }
        />

        {verdict && <LiveVerdict verdict={verdict} price={price} fairMax={range.fairMax} />}

        <Button
          size="lg"
          className="mt-4 w-full"
          disabled={!validPrice}
          onClick={() => validPrice && onVerify({ product, price, range, detected, ai })}
        >
          {t('scanner.fullAnalysis')}
        </Button>
        {ai && <p className="mt-3 text-center text-xs text-ink-3">{t('scanner.aiDisclaimer')}</p>}
      </div>}
    </section>
  );
}

function LiveVerdict({ verdict, price, fairMax }: { verdict: VerdictLevel; price: number; fairMax: number }) {
  const { t } = useI18n();
  const meta = VERDICT_META[verdict];
  const Icon = VERDICT_ICONS[verdict];
  const over = price - fairMax;

  return (
    <div
      key={verdict}
      className="mt-4 flex animate-fade-in items-start gap-3 rounded-xl p-3"
      style={{ background: `${meta.color}1F` }}
      role="status"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ background: meta.color }}>
        <Icon className="h-5 w-5 text-ink" strokeWidth={2.5} />
      </span>
      <div className="min-w-0">
        <p className="font-semibold" style={{ color: meta.text }}>
          {t(`verdict.${verdict}`)}
        </p>
        <p className="text-sm text-ink">
          {verdict === 'fair'
            ? t('scanner.liveFair')
            : t('scanner.liveAbove', { amount: formatMoney(over), pct: Math.round((over / fairMax) * 100) })}
        </p>
      </div>
    </div>
  );
}
