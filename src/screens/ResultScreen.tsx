import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Lightbulb,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  ShieldAlert,
  Sparkles,
  Store,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { AdSlot } from '../components/AdSlot';
import { Button } from '../components/ui/Button';
import { IconCircle, ListRow, Divider } from '../components/ui/Section';
import { CityBadge } from '../components/CityPicker';
import { GoogleLink, ItemThumb, PhotoCredit } from '../components/DetectedItem';
import { PriceRangeBar } from '../components/PriceRangeBar';
import { cityOf } from '../data/cities';
import { CUSTOM_EMOJI, findProduct } from '../data/mockData';
import { useI18n } from '../i18n';
import { cn } from '../lib/cn';
import { formatMoney, formatForeign, isSameCurrency } from '../lib/format';
import { negotiationPhrase } from '../lib/negotiate';
import { VERDICT_META } from '../lib/pricing';
import type { CommunityStats, Consultation, FxContext, VerdictLevel } from '../types';

const VERDICT_ICONS: Record<VerdictLevel, LucideIcon> = {
  fair: CheckCircle2,
  tourist: AlertTriangle,
  abusive: ShieldAlert,
};

interface ResultScreenProps {
  consultation: Consultation;
  fx: FxContext;
  stats: CommunityStats;
  onBack: () => void;
  onPay: () => void;
  onReport: (paid: number) => void;
}

export function ResultScreen({ consultation: c, fx, stats, onBack, onPay, onReport }: ResultScreenProps) {
  const { t, tp, productName, productTip, cityArea, cityTip } = useI18n();
  // null para itens fora do catálogo, cujo preço veio só da IA
  const product = findProduct(c.productId);
  const name = c.item?.name ?? (product ? productName(product) : '');
  const city = cityOf(c);
  const meta = VERDICT_META[c.verdict];
  const Icon = VERDICT_ICONS[c.verdict];
  const { range } = c;
  const overFair = c.price - range.fairMax;
  const overPct = Math.round((overFair / range.fairMax) * 100);
  // Dica da IA; senão a do catálogo (consultas antigas guardavam o texto, as novas só o índice)
  const tip =
    c.ai?.tip ||
    (product && c.tipIndex !== undefined ? productTip(product, c.tipIndex) : (c.tip ?? (product ? productTip(product, 0) : '')));
  const askFor = Math.round(range.fairMax);
  // Consultas antigas não guardavam a moeda: eram todas em reais
  const currency = c.currency ?? 'BRL';
  const money = (value: number) => formatMoney(value, currency);
  const phrase = negotiationPhrase(city.countryCode, askFor, currency);

  const summary =
    c.verdict === 'fair'
      ? t(c.price < range.fairMin ? 'result.summaryBelow' : 'result.summaryFair')
      : t(c.verdict === 'tourist' ? 'result.summaryTourist' : 'result.summaryAbusive', {
          amount: money(overFair),
          pct: overPct,
        });

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        aria-label={t('common.back')}
        className="-ms-2 grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-muted"
      >
        <ArrowLeft className="h-6 w-6 rtl:-scale-x-100" />
      </button>

      <div className="mt-3">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-ink"
          style={{ background: meta.color }}
        >
          <Icon className="h-4 w-4" strokeWidth={2.5} /> {t(`verdict.${c.verdict}`)}
        </span>
        <p dir="ltr" className="mt-4 text-start text-[44px] font-bold leading-none tracking-tight tabular-nums">
          {money(c.price)}
        </p>
        <p className="mt-2 text-ink-2">
          {!isSameCurrency(fx, currency) && <>≈ {formatForeign(c.price, fx, currency)} · </>}
          {city.name}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <ItemThumb image={c.item?.image} emoji={product?.emoji ?? CUSTOM_EMOJI} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{name}</p>
            {c.ai?.unit && <p className="text-sm text-ink-2">{c.ai.unit}</p>}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <GoogleLink query={c.item?.name ?? (product && currency !== 'BRL' ? product.nameEn : product?.name) ?? name} />
          {c.item?.image && <PhotoCredit image={c.item.image} />}
        </div>
        <p className="mt-4">{summary}</p>
      </div>

      <div className="mt-6">
        <PriceRangeBar range={range} verdict={c.verdict} currency={currency} />
      </div>

      <Divider />

      <div className="divide-y divide-line">
        <ListRow
          icon={<IconCircle><MapPin className="h-5 w-5" /></IconCircle>}
          title={
            c.ai
              ? t('scanner.fairPriceIn', { city: city.name })
              : city.curated
                ? t('result.fairRangeIn', { area: cityArea(city) })
                : t('result.fairRangeEstimated', { city: city.name })
          }
          subtitle={
            <>
              {money(range.fairMin)} – {money(range.fairMax)}
              {!isSameCurrency(fx, currency) &&
                ` (${formatForeign(range.fairMin, fx, currency)} – ${formatForeign(range.fairMax, fx, currency)})`}
              <span className="mt-1.5 flex">
                {c.ai ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2 py-0.5 text-xs font-semibold text-ink">
                    <Sparkles className="h-3 w-3" /> {t('scanner.aiEstimate')}
                  </span>
                ) : (
                  <CityBadge city={city} />
                )}
              </span>
            </>
          }
        />
        <ListRow
          icon={<IconCircle><Users className="h-5 w-5" /></IconCircle>}
          title={t('result.community')}
          subtitle={
            stats.reports > 0
              ? tp('result.communityStats', stats.reports, { avg: money(stats.avgPaid) })
              : t('result.noReports')
          }
        />
        {c.ai?.explanation && (
          <ListRow
            icon={<IconCircle><Sparkles className="h-5 w-5" /></IconCircle>}
            title={t('result.whyThisPrice')}
            subtitle={c.ai.explanation}
          />
        )}
        {tip && <ListRow icon={<IconCircle><Lightbulb className="h-5 w-5" /></IconCircle>} title={t('result.localTip')} subtitle={tip} />}
        <ListRow
          icon={<IconCircle><Store className="h-5 w-5" /></IconCircle>}
          title={t('result.inCity', { city: city.name })}
          subtitle={cityTip(city)}
        />
        {c.verdict !== 'fair' && (
          <ListRow
            icon={<IconCircle><MessageCircle className="h-5 w-5" /></IconCircle>}
            // A frase fica no idioma da cidade: é o que o turista vai dizer ao vendedor
            title={<span lang={phrase.lang}>{phrase.text}</span>}
            subtitle={city.countryCode === 'BR' ? t('result.negotiateHint', { n: askFor }) : t('result.negotiateHintLocal')}
          />
        )}
      </div>

      <Divider />

      <div className="space-y-2">
        <Button size="lg" className="w-full" onClick={onPay}>
          {t('result.payWithWallet')}
        </Button>
        <ReportPanel consultation={c} fx={fx} stats={stats} onReport={onReport} />
      </div>

      {/* Longe dos botões: o Google pune anúncio que leva a clique acidental */}
      <AdSlot placement="result" className="mt-10" />
    </div>
  );
}

interface ReportPanelProps {
  consultation: Consultation;
  fx: FxContext;
  stats: CommunityStats;
  onReport: (paid: number) => void;
}

function ReportPanel({ consultation: c, fx, stats, onReport }: ReportPanelProps) {
  const { t, tp } = useI18n();
  const [open, setOpen] = useState(false);
  const [paid, setPaid] = useState(c.price);
  const currency = c.currency ?? 'BRL';
  const money = (value: number) => formatMoney(value, currency);

  if (c.paidReported !== undefined) {
    return (
      <ListRow
        icon={
          <IconCircle className="bg-fair">
            <Check className="h-5 w-5" strokeWidth={3} />
          </IconCircle>
        }
        title={t('result.thanks')}
        subtitle={tp('result.thanksDetail', stats.reports, { paid: money(c.paidReported), city: cityOf(c).name })}
      />
    );
  }

  if (!open) {
    return (
      <Button variant="secondary" size="lg" className="w-full" onClick={() => setOpen(true)}>
        {t('result.reportCta')}
      </Button>
    );
  }

  const presets = [
    { label: t('result.presetCharged'), value: c.price },
    { label: t('result.presetFair'), value: c.range.fairMax },
  ];

  return (
    <div className="animate-fade-in rounded-xl bg-muted p-4">
      <p className="font-semibold">{t('result.howMuch')}</p>
      <p className="text-sm text-ink-2">{t('result.anonymous')}</p>
      <div dir="ltr" className="mt-5 flex items-center justify-between">
        <StepperButton label={t('result.decrease')} icon={Minus} onClick={() => setPaid((p) => Math.max(0.5, p - 1))} />
        <div className="text-center">
          <p className="text-3xl font-bold tabular-nums">{money(paid)}</p>
          {!isSameCurrency(fx, currency) && <p className="text-sm text-ink-2">≈ {formatForeign(paid, fx, currency)}</p>}
        </div>
        <StepperButton label={t('result.increase')} icon={Plus} onClick={() => setPaid((p) => p + 1)} />
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setPaid(p.value)}
            className={cn(
              'h-8 rounded-full px-3 text-sm font-medium transition-colors',
              paid === p.value ? 'bg-ink text-white' : 'bg-white',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <Button className="mt-4 w-full" onClick={() => onReport(paid)}>
        {t('result.send')}
      </Button>
    </div>
  );
}

function StepperButton({ label, icon: Icon, onClick }: { label: string; icon: LucideIcon; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-12 w-12 place-items-center rounded-full bg-white transition-colors hover:bg-muted-2"
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
