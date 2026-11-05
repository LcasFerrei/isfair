import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useI18n } from '../../i18n';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Fica fixo abaixo do título, fora da área com rolagem (ex.: campo de busca) */
  header?: ReactNode;
  children: ReactNode;
}

/** Gaveta que sobe da parte de baixo da tela (no desktop, aparece centralizada). */
export function Sheet({ open, onClose, title, header, children }: SheetProps) {
  const { t } = useI18n();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label={t('common.close')} onClick={onClose} className="absolute inset-0 animate-overlay-in bg-ink/45" />
      <div className="relative flex max-h-[88dvh] w-full max-w-[480px] animate-sheet-up flex-col rounded-t-3xl bg-white shadow-2xl sm:max-h-[80vh] sm:rounded-3xl">
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-muted-2 sm:hidden" />
        <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-3 sm:pt-5">
          <h2 className="text-xl font-bold tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="-me-2 grid h-9 w-9 place-items-center rounded-full bg-muted transition-colors hover:bg-muted-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {header && <div className="shrink-0 px-5 pb-2">{header}</div>}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
