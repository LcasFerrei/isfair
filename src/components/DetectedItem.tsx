import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useI18n } from '../i18n';
import { cn } from '../lib/cn';
import type { ItemImage } from '../types';

export const googleSearchUrl = (query: string) => `https://www.google.com/search?q=${encodeURIComponent(query)}`;

/** Foto do item encontrada na internet; se não houver (ou não carregar), mostra o emoji. */
export function ItemThumb({ image, emoji, className }: { image: ItemImage | null | undefined; emoji: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={cn('grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted text-2xl', className)}>
      {image && !failed ? (
        <img
          src={image.url}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full bg-white object-contain"
        />
      ) : (
        emoji
      )}
    </span>
  );
}

/** "Ver no Google ↗" — abre a pesquisa do item numa nova aba do navegador. */
export function GoogleLink({ query, className }: { query: string; className?: string }) {
  const { t } = useI18n();
  return (
    <a
      href={googleSearchUrl(query)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full bg-muted px-3 text-sm font-medium transition-colors hover:bg-muted-2',
        className,
      )}
    >
      {t('scanner.searchGoogle')}
      <ExternalLink className="h-3.5 w-3.5 rtl:-scale-x-100" />
    </a>
  );
}

/** Crédito da foto (as imagens do Open Food Facts são CC BY-SA). */
export function PhotoCredit({ image }: { image: ItemImage }) {
  const { t } = useI18n();
  return (
    <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-ink-3 underline-offset-2 hover:underline">
      {t('scanner.photoCredit', { source: image.source })}
    </a>
  );
}
