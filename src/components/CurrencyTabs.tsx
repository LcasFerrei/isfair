import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CURRENCIES } from '../data/mockData';
import { WALLET_CURRENCIES } from '../data/money';
import { useI18n } from '../i18n';
import { cn } from '../lib/cn';
import type { WalletCurrency } from '../types';
import { Flag } from './ui/Flag';

interface CurrencyTabsProps {
  value: WalletCurrency;
  onChange: (currency: WalletCurrency) => void;
  label: string;
  /** As abas andam sozinhas em loop (vitrine da landing); pausa ao passar o mouse ou tocar */
  autoPlay?: boolean;
  className?: string;
}

/** Arraste maior que isso é rolagem, não clique */
const DRAG_THRESHOLD_PX = 6;
/** Velocidade do movimento automático */
const AUTO_SPEED_PX_PER_S = 55;
/** Depois de uma interação, espera isso antes de voltar a andar */
const RESUME_DELAY_MS = 2500;

/**
 * Carrossel de moedas (bandeira + código): setas nas pontas quando há mais abas daquele lado,
 * degradê nas bordas, encaixe em cada aba e arrastar com o mouse. A aba ativa sempre fica à vista.
 * Com autoPlay, a lista é renderizada duas vezes e a rolagem volta ao início sem salto visível.
 */
export function CurrencyTabs({ value, onChange, label, autoPlay = false, className }: CurrencyTabsProps) {
  const { t, currencyName, info } = useI18n();
  const track = useRef<HTMLDivElement>(null);
  const active = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ x: number; scroll: number; moved: boolean } | null>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  const rtl = info.dir === 'rtl';

  const [reducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const looping = autoPlay && !reducedMotion;
  const hovering = useRef(false);
  const pausedUntil = useRef(0);
  /** Posição fracionária: o scrollLeft do navegador arredonda e travaria em velocidades baixas */
  const position = useRef(0);

  const pause = () => {
    pausedUntil.current = performance.now() + RESUME_DELAY_MS;
  };

  /** No loop, metade do conteúdo é a cópia: passou dela, volta uma "volta" inteira */
  const wrap = useCallback(() => {
    const el = track.current;
    if (!el || !looping) return;
    const half = el.scrollWidth / 2;
    const pos = Math.abs(el.scrollLeft);
    if (pos >= half) el.scrollLeft -= (rtl ? -1 : 1) * half;
    else if (pos <= 0) el.scrollLeft += (rtl ? -1 : 1) * half;
  }, [looping, rtl]);

  // Em RTL o scrollLeft é negativo; o valor absoluto mede a distância do início
  const updateEdges = useCallback(() => {
    const el = track.current;
    if (!el) return;
    if (looping) {
      setEdges({ start: true, end: true });
      return;
    }
    const pos = Math.abs(el.scrollLeft);
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ start: pos > 2, end: pos < max - 2 });
  }, [looping]);

  useEffect(() => {
    pause();
    // block: 'nearest' rola só o carrossel, sem mexer na página
    active.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [value]);

  useEffect(() => {
    updateEdges();
    const observer = new ResizeObserver(updateEdges);
    if (track.current) observer.observe(track.current);
    return () => observer.disconnect();
  }, [updateEdges]);

  // Movimento contínuo
  useEffect(() => {
    if (!looping) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const el = track.current;
      const dt = Math.min(now - last, 100) / 1000;
      last = now;
      if (el) {
        const idle = !hovering.current && !drag.current && now > pausedUntil.current;
        if (idle) {
          position.current += (rtl ? -1 : 1) * AUTO_SPEED_PX_PER_S * dt;
          el.scrollLeft = position.current;
          wrap();
        }
        // Sincroniza com rolagens feitas pelo usuário, pelas setas ou pelo wrap
        if (!idle || Math.abs(el.scrollLeft - position.current) > 1) position.current = el.scrollLeft;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [looping, rtl, wrap]);

  /** Avança ~70% da largura visível; direction 1 = para o fim da lista */
  const page = (direction: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    pause();
    el.scrollBy({ left: direction * (rtl ? -1 : 1) * el.clientWidth * 0.7, behavior: 'smooth' });
  };

  // Arrastar com o mouse (no toque, a rolagem nativa já resolve)
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    pause();
    if (e.pointerType !== 'mouse' || !track.current) return;
    drag.current = { x: e.clientX, scroll: track.current.scrollLeft, moved: false };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || !track.current) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) < DRAG_THRESHOLD_PX) return;
    if (!d.moved) {
      d.moved = true;
      track.current.setPointerCapture(e.pointerId);
    }
    track.current.scrollLeft = d.scroll - dx;
  };
  const endDrag = () => {
    pause();
    // Mantém "moved" até o clique que vem logo depois, para ele ser ignorado
    window.setTimeout(() => (drag.current = null), 0);
  };

  const arrow = (side: 'start' | 'end') => {
    const visible = edges[side];
    const Icon = side === 'start' ? ChevronLeft : ChevronRight;
    return (
      <>
        {/* Degradê para indicar que há mais moedas */}
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-y-0 z-10 w-16 from-white to-transparent transition-opacity',
            side === 'start' ? 'start-0 bg-gradient-to-r rtl:bg-gradient-to-l' : 'end-0 bg-gradient-to-l rtl:bg-gradient-to-r',
            visible ? 'opacity-100' : 'opacity-0',
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={t(side === 'start' ? 'common.previous' : 'common.next')}
          onClick={() => page(side === 'start' ? -1 : 1)}
          className={cn(
            'absolute top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white shadow-md ring-1 ring-line transition-all hover:bg-muted',
            side === 'start' ? 'start-0' : 'end-0',
            visible ? 'opacity-100' : 'pointer-events-none scale-75 opacity-0',
          )}
        >
          <Icon className="h-5 w-5 rtl:-scale-x-100" />
        </button>
      </>
    );
  };

  // No loop, a segunda cópia só existe para o visual: fica fora da leitura de tela e do Tab
  const copies = looping ? [0, 1] : [0];

  return (
    <div
      className={cn('relative', className)}
      onMouseEnter={() => (hovering.current = true)}
      onMouseLeave={() => {
        hovering.current = false;
        pause();
      }}
      onFocus={pause}
    >
      {arrow('start')}
      <div
        ref={track}
        role="tablist"
        aria-label={label}
        onScroll={() => {
          wrap();
          updateEdges();
        }}
        onWheel={pause}
        onTouchStart={pause}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={cn(
          'no-scrollbar flex gap-2 overflow-x-auto scroll-px-10 select-none',
          // O encaixe brigaria com o movimento contínuo
          !looping && 'snap-x snap-proximity',
        )}
      >
        {copies.map((copy) =>
          WALLET_CURRENCIES.map((code) => {
            const currency = CURRENCIES.find((c) => c.code === code);
            const selected = code === value;
            return (
              <button
                key={`${copy}-${code}`}
                ref={selected && copy === 0 ? active : undefined}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-hidden={copy > 0 || undefined}
                tabIndex={copy > 0 ? -1 : undefined}
                onClick={() => {
                  if (!drag.current?.moved) onChange(code);
                }}
                title={currencyName(code)}
                className={cn(
                  'flex h-10 shrink-0 snap-start items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors',
                  selected ? 'bg-ink text-white' : 'bg-muted hover:bg-muted-2',
                )}
              >
                {currency && <Flag code={currency.flag} className="pointer-events-none h-3.5" />}
                {code}
              </button>
            );
          }),
        )}
      </div>
      {arrow('end')}
    </div>
  );
}
