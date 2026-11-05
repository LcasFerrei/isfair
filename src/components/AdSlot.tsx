import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n';
import { adProvider, adsenseSlot, ADSENSE_CLIENT, fillAdSense, loadAdSense, type AdPlacement } from '../lib/ads';
import { cn } from '../lib/cn';

interface AdSlotProps {
  placement: AdPlacement;
  className?: string;
}

/**
 * Espaço de anúncio. Web: bloco responsivo do AdSense. App nativo (futuro): AdMob, ainda não ligado.
 * Sem configuração não ocupa espaço; em desenvolvimento mostra uma moldura para ver onde o anúncio vai ficar.
 */
export function AdSlot({ placement, className }: AdSlotProps) {
  const { t } = useI18n();
  const filled = useRef(false);
  const provider = adProvider();
  const slot = provider === 'adsense' ? adsenseSlot(placement) : undefined;

  useEffect(() => {
    if (!slot || filled.current) return;
    filled.current = true;
    loadAdSense();
    try {
      fillAdSense();
    } catch {
      // bloqueador de anúncios ou script fora do ar: o espaço só fica vazio
    }
  }, [slot]);

  if (!slot) {
    if (!import.meta.env.DEV) return null;
    return (
      <div className={cn('grid h-24 place-items-center rounded-xl border-2 border-dashed border-line text-xs text-ink-3', className)}>
        {t('ads.label')} · {placement} ({provider}) — dev
      </div>
    );
  }

  return (
    // Rótulo "Publicidade": o Google recomenda deixar claro que é anúncio
    <aside className={cn('overflow-hidden', className)} aria-label={t('ads.label')}>
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-ink-3">{t('ads.label')}</p>
      <ins
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
