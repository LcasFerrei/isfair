import { useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useI18n } from '../i18n';

const VISIBLE_MS = 5000;

interface NotificationToastProps {
  /** null = escondido; a chave muda a cada notificação para reiniciar a animação e o tempo */
  toast: { id: string; title: string; body: string } | null;
  onOpen: () => void;
  onClose: () => void;
}

/** Aviso no topo da tela quando uma notificação chega com o app aberto. Some sozinho. */
export function NotificationToast({ toast, onOpen, onClose }: NotificationToastProps) {
  const { t } = useI18n();

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(onClose, VISIBLE_MS);
    return () => window.clearTimeout(id);
  }, [toast?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!toast) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-40 flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div
        key={toast.id}
        className="pointer-events-auto flex w-full max-w-[448px] animate-scale-in items-start gap-3 rounded-2xl bg-ink p-3 pe-2 text-white shadow-2xl shadow-ink/30"
      >
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-start gap-3 text-start">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-fair text-ink">
            <Bell className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{toast.title}</span>
            <span className="mt-0.5 line-clamp-2 text-sm text-white/75">{toast.body}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
