import { useId, useMemo } from 'react';
import { useI18n } from '../i18n';
import { cn } from '../lib/cn';
import { formatMoney } from '../lib/format';
import type { ChangePiece, CoinMetal, Denomination } from '../types';

/** A maior cédula (R$ 100, 156 mm) ocupa 100% da largura disponível. */
const MAX_NOTE_WIDTH_MM = 156;
/** Pixels por mm na versão compacta (troco, recibo). */
const COMPACT_SCALE = 0.62;

export const noteWidthPct = (denom: Denomination) => Math.min(100, (denom.size[0] / MAX_NOTE_WIDTH_MM) * 100);

/** Fonte que faz o número caber na largura (cédulas de 100000 guaranis, moedas de 1000 pesos…). */
const fitFont = (value: number, max: number, width: number) => Math.min(max, width / (String(value).length * 0.62));

const svgId = (raw: string) => raw.replace(/[^a-zA-Z0-9_-]/g, '');

function hexToRgb01(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map((v) => v.toFixed(3));
}

/** Linhas onduladas de fundo (guilhoché), determinísticas por cédula. */
function guilloche(W: number, H: number, seed: number) {
  const lines = 18;
  const period = W / (2.5 + (seed % 3) * 0.5);
  return Array.from({ length: lines }, (_, i) => {
    const y0 = (H / (lines - 1)) * i;
    const amp = 3 + ((i * 7 + seed) % 4);
    let d = `M0 ${y0.toFixed(1)}`;
    for (let x = 3; x <= W + 3; x += 3) {
      d += `L${x} ${(y0 + amp * Math.sin((x / period) * 2 * Math.PI + i * 0.55)).toFixed(1)}`;
    }
    return d;
  });
}

function rosette(cx: number, cy: number, radius: number, amp: number, petals: number) {
  let d = '';
  for (let deg = 0; deg <= 360; deg += 2) {
    const t = (deg * Math.PI) / 180;
    const r = radius + amp * Math.sin(petals * t);
    d += `${deg ? 'L' : 'M'}${(cx + r * Math.cos(t)).toFixed(1)} ${(cy + r * Math.sin(t)).toFixed(1)}`;
  }
  return `${d}Z`;
}

interface BanknoteProps {
  denom: Denomination;
  /** Versão pequena, com largura proporcional ao tamanho real e sem textos miúdos */
  compact?: boolean;
  className?: string;
}

/** Verso das cédulas da 2ª família: número, animal em gravura, guilhoché, fio de segurança e área da marca d'água. */
export function Banknote({ denom, compact = false, className }: BanknoteProps) {
  const { t, noteLabel } = useI18n();
  const id = svgId(useId());
  const [wMm, hMm] = denom.size;
  const W = wMm * 2;
  const H = hMm * 2;
  const ink = denom.ink ?? '#333333';
  const paper = denom.paper ?? '#EEEEEE';
  const [r, g, b] = hexToRgb01(ink);

  const art = useMemo(
    () => ({
      waves: guilloche(W, H, denom.value),
      rosettes: [0, 1, 2].map((k) => rosette(W * 0.17, H * 0.38, 20 + k * 6, 3 + k, 12 + k * 4)),
    }),
    [W, H, denom.value],
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={
        noteLabel(denom)
          ? t('money.noteAria', { value: formatMoney(denom.value, denom.currency), animal: noteLabel(denom) })
          : formatMoney(denom.value, denom.currency)
      }
      className={cn('block h-auto shrink-0 select-none rounded-[3px] shadow-[0_1px_3px_rgba(11,27,61,0.25)]', className)}
      // A arte da cédula não espelha em idiomas da direita para a esquerda
      style={{ width: compact ? wMm * COMPACT_SCALE : '100%', direction: 'ltr' }}
    >
      <defs>
        <filter id={`${id}-engrave`} colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values={`0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  -0.45 -0.45 -0.45 1.4 0`}
          />
        </filter>
        <linearGradient id={`${id}-tone`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={ink} stopOpacity="0.2" />
          <stop offset="0.6" stopColor={ink} stopOpacity="0.06" />
          <stop offset="1" stopColor={ink} stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <rect width={W} height={H} rx="4" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${id}-clip)`} fontFamily="Figtree, Arial, sans-serif">
        <rect width={W} height={H} fill={paper} />
        <rect width={W} height={H} fill={`url(#${id}-tone)`} />
        <g fill="none" stroke={ink} strokeWidth="0.6" opacity="0.22">
          {art.waves.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>

        {/* Área clara da marca d'água */}
        <rect x={W * 0.74} width={W * 0.26} height={H} fill="#FFFFFF" opacity="0.5" />
        <ellipse cx={W * 0.87} cy={H * 0.46} rx={W * 0.08} ry={H * 0.3} fill={ink} opacity="0.07" />

        {/* Fio de segurança */}
        <line x1={W * 0.7} x2={W * 0.7} y1="0" y2={H} stroke={ink} strokeWidth="1.4" strokeDasharray="4 3" opacity="0.45" />

        <g fill="none" stroke={ink} strokeWidth="0.7" opacity="0.4">
          {art.rosettes.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <text
          x={W * 0.17}
          y={H * 0.38}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={fitFont(denom.value, H * 0.34, W * 0.3)}
          fontWeight={800}
          fill={ink}
          letterSpacing="-1"
        >
          {denom.value}
        </text>

        <text
          x={W * 0.46}
          y={H * 0.56}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={H * 0.58}
          filter={`url(#${id}-engrave)`}
        >
          {denom.emoji}
        </text>

        <text x={W * 0.95} y={H * 0.88} textAnchor="end" fontSize={fitFont(denom.value, H * 0.2, W * 0.2)} fontWeight={800} fill={ink}>
          {denom.value}
        </text>

        {!compact && (
          <>
            <text x={W * 0.5} y={H * 0.13} textAnchor="middle" fontSize={H * 0.068} fontWeight={700} fill={ink} letterSpacing="1.2">
              {denom.issuer ?? 'BANCO CENTRAL DO BRASIL'}
            </text>
            <text x={W * 0.06} y={H * 0.9} fontSize={H * 0.075} fontWeight={700} fill={ink} letterSpacing="0.8">
              {denom.words}
            </text>
          </>
        )}

        <rect x="3" y="3" width={W - 6} height={H - 6} rx="3" fill="none" stroke={ink} strokeOpacity="0.3" />
      </g>
    </svg>
  );
}

/** Tons de cada metal: [brilho, médio, sombra, relevo]. */
const METALS: Record<Exclude<CoinMetal, 'bimetal' | 'bimetalInverse'>, [string, string, string, string]> = {
  silver: ['#FFFFFF', '#CDD2D8', '#8A9099', '#4A5058'],
  gold: ['#FFF4C2', '#E3BB4E', '#9A7114', '#5E4206'],
  copper: ['#FAD3B2', '#C97B42', '#7E3F15', '#4D230A'],
};

function MetalGradient({ id, tones }: { id: string; tones: string[] }) {
  return (
    <radialGradient id={id} cx="35%" cy="30%" r="80%">
      <stop offset="0" stopColor={tones[0]} />
      <stop offset="0.5" stopColor={tones[1]} />
      <stop offset="1" stopColor={tones[2]} />
    </radialGradient>
  );
}

interface CoinProps {
  denom: Denomination;
  /** Pixels por mm de diâmetro */
  scale?: number;
}

/** Reverso das moedas da 2ª família, com tamanho proporcional ao diâmetro real. */
export function Coin({ denom, scale = 1.45 }: CoinProps) {
  const { t } = useI18n();
  const id = svgId(useId());
  const px = denom.size[0] * scale;
  const metal = denom.metal ?? 'silver';
  // bimetal: anel dourado e miolo prateado (R$ 1, € 2); bimetalInverse: o contrário (€ 1)
  const outer = metal === 'bimetal' ? METALS.gold : metal === 'bimetalInverse' ? METALS.silver : METALS[metal];
  const inner = metal === 'bimetal' ? METALS.silver : metal === 'bimetalInverse' ? METALS.gold : outer;
  const isBimetal = metal === 'bimetal' || metal === 'bimetalInverse';
  const whole = denom.value >= 1;
  const numeral = whole ? denom.value : Math.round(denom.value * 100);
  const numeralSize = fitFont(numeral, whole ? 36 : 30, 62);

  return (
    <svg viewBox="0 0 100 100" width={px} height={px} role="img" aria-label={t('money.coinAria', { value: formatMoney(denom.value, denom.currency) })} className="shrink-0 select-none" style={{ direction: 'ltr' }}>
      <defs>
        <MetalGradient id={`${id}-outer`} tones={outer} />
        <MetalGradient id={`${id}-inner`} tones={inner} />
        <path id={`${id}-arc`} d="M 20 50 A 30 30 0 0 0 80 50" />
      </defs>

      <circle cx="50" cy="50" r="49" fill={`url(#${id}-outer)`} />
      {/* Serrilha e aro */}
      <circle cx="50" cy="50" r="47" fill="none" stroke={outer[3]} strokeOpacity="0.45" strokeWidth="2.5" strokeDasharray="1.3 1.3" />
      <circle cx="50" cy="50" r="43" fill="none" stroke={outer[3]} strokeOpacity="0.4" />
      <g stroke={outer[3]} strokeOpacity="0.18" strokeWidth="0.8">
        {Array.from({ length: 48 }, (_, i) => {
          const t = (i / 48) * 2 * Math.PI;
          return (
            <line
              key={i}
              x1={50 + 34 * Math.cos(t)}
              y1={50 + 34 * Math.sin(t)}
              x2={50 + 41 * Math.cos(t)}
              y2={50 + 41 * Math.sin(t)}
            />
          );
        })}
      </g>
      {isBimetal && (
        <circle cx="50" cy="50" r="32" fill={`url(#${id}-inner)`} stroke={outer[3]} strokeOpacity="0.5" />
      )}

      <g fontFamily="Figtree, Arial, sans-serif" fontWeight={800} textAnchor="middle">
        <text x="49.3" y="45.3" dominantBaseline="central" fontSize={numeralSize} fill={inner[0]} opacity="0.8">
          {numeral}
        </text>
        <text x="50" y="46" dominantBaseline="central" fontSize={numeralSize} fill={inner[3]}>
          {numeral}
        </text>
        <text fontSize={denom.words.length > 8 ? 7.5 : 9} fill={inner[3]} letterSpacing="1.5">
          <textPath href={`#${id}-arc`} startOffset="50%">
            {denom.words}
          </textPath>
        </text>
      </g>
    </svg>
  );
}

/** Cédulas e moedas lado a lado com multiplicador (ex.: R$ 20 ×2). */
export function MoneyStack({ pieces }: { pieces: ChangePiece[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {pieces.map(({ denom, count }) => (
        <div key={`${denom.kind}-${denom.value}`} className="flex items-center gap-1.5">
          {denom.kind === 'note' ? <Banknote denom={denom} compact /> : <Coin denom={denom} />}
          {count > 1 && <span className="text-sm font-semibold">×{count}</span>}
        </div>
      ))}
    </div>
  );
}
