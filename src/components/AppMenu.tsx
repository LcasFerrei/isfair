import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, LogOut, User, X, type LucideIcon } from 'lucide-react';
import { APP_VERSION } from '../config';
import { useI18n } from '../i18n';
import { cn } from '../lib/cn';
import { AdSlot } from './AdSlot';
import { Logo } from './Logo';

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Sem ação = recurso futuro, aparece como "Em breve" */
  onSelect?: () => void;
  active?: boolean;
  /** Contador (ex.: notificações não lidas); 0 não aparece */
  badge?: number;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface AppMenuProps {
  open: boolean;
  onClose: () => void;
  sections: MenuSection[];
  /** Conta conectada; null = visitante */
  account: { name: string; email: string } | null;
  onSignIn: () => void;
  onLogout: () => void;
}

/** Menu lateral (hambúrguer). Novos itens entram em `sections`, montado no App. */
export function AppMenu({ open, onClose, sections, account, onSignIn, onLogout }: AppMenuProps) {
  const { t, dir } = useI18n();
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

  const select = (item: MenuItem) => {
    if (!item.onSelect) return;
    item.onSelect();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t('header.openMenu')}>
      <button type="button" aria-label={t('menu.closeMenu')} onClick={onClose} className="absolute inset-0 animate-overlay-in bg-ink/45" />
      {/* Alinhado à coluna do app (480 px) em telas grandes; em árabe abre pela direita */}
      <nav
        className={cn(
          'absolute inset-y-0 flex w-[min(85vw,320px)] flex-col bg-white shadow-2xl',
          dir === 'rtl' ? 'animate-drawer-in-rtl' : 'animate-drawer-in',
        )}
        style={dir === 'rtl' ? { right: 'max(0px, calc(50% - 240px))' } : { left: 'max(0px, calc(50% - 240px))' }}
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
          <Logo />
          <button
            type="button"
            onClick={onClose}
            aria-label={t('menu.closeMenu')}
            className="-me-2 grid h-9 w-9 place-items-center rounded-full bg-muted transition-colors hover:bg-muted-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {/* Perfil: conta conectada ou convite para entrar */}
          {account ? (
            <div className="mx-5 mt-2 flex items-center gap-3 rounded-2xl bg-muted p-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-lg font-bold uppercase text-white">
                {account.name.trim().charAt(0) || <User className="h-6 w-6" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{account.name}</span>
                <span className="block truncate text-sm text-ink-2" dir="ltr">
                  {account.email}
                </span>
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSignIn();
              }}
              className="mx-5 mt-2 flex w-[calc(100%-2.5rem)] items-center gap-3 rounded-2xl bg-ink p-4 text-start text-white transition-colors hover:bg-ink/90"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10">
                <User className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{t('menu.signInCta')}</span>
                <span className="block text-sm text-white/70">{t('menu.guestHint')}</span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-white/70 rtl:-scale-x-100" />
            </button>
          )}

          {sections.map((section) => (
            <section key={section.title} className="mt-5">
              <h3 className="px-5 pb-1 text-sm font-semibold text-ink-2">{section.title}</h3>
              <ul>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const soon = !item.onSelect;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => select(item)}
                        disabled={soon}
                        aria-current={item.active ? 'page' : undefined}
                        className={cn(
                          'flex w-full items-center gap-4 px-5 py-3 text-start transition-colors',
                          soon ? 'cursor-default' : 'hover:bg-muted',
                          item.active && 'bg-muted',
                        )}
                      >
                        <Icon className={cn('h-5 w-5 shrink-0', soon ? 'text-ink-3' : 'text-ink')} />
                        <span className={cn('flex-1 font-medium', soon && 'text-ink-2')}>{item.label}</span>
                        {soon ? (
                          <SoonBadge label={t('common.soon')} />
                        ) : item.badge ? (
                          <span className="grid h-6 min-w-6 place-items-center rounded-full bg-fair px-1.5 text-xs font-bold text-ink tabular-nums">
                            {item.badge > 9 ? '9+' : item.badge}
                          </span>
                        ) : (
                          <ChevronRight className="h-4 w-4 text-ink-3 rtl:-scale-x-100" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          {/* Separado dos itens do menu para não ser confundido com eles nem tocado por engano */}
          <div className="mx-5 mb-4 mt-6 border-t border-line pt-4">
            <AdSlot placement="menu" />
          </div>
        </div>

        <div className="border-t border-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
          {account && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="-mx-5 flex w-[calc(100%+2.5rem)] items-center gap-4 px-5 py-3 text-start font-medium text-abusive-text transition-colors hover:bg-abusive/5"
            >
              <LogOut className="h-5 w-5 rtl:-scale-x-100" /> {t('menu.logout')}
            </button>
          )}
          <p className="text-xs text-ink-3">IsFair v{APP_VERSION}</p>
        </div>
      </nav>
    </div>,
    document.body,
  );
}

function SoonBadge({ label }: { label: string }) {
  return <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-ink-2 ring-1 ring-line">{label}</span>;
}
