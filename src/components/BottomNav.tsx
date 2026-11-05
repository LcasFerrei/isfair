import { History as HistoryIcon, ScanLine, Wallet as WalletIcon, type LucideIcon } from 'lucide-react';
import { useI18n, type UiKey } from '../i18n';
import { cn } from '../lib/cn';
import type { Tab } from '../types';

const ITEMS: { tab: Tab; label: UiKey; icon: LucideIcon }[] = [
  { tab: 'scanner', label: 'nav.scanner', icon: ScanLine },
  { tab: 'cash', label: 'nav.wallet', icon: WalletIcon },
  { tab: 'history', label: 'nav.history', icon: HistoryIcon },
];

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  const { t } = useI18n();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t border-line bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-3">
        {ITEMS.map(({ tab, label, icon: Icon }) => {
          const isActive = active === tab || (tab === 'scanner' && active === 'result');
          return (
            <li key={tab}>
              <button
                type="button"
                onClick={() => onChange(tab)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex w-full flex-col items-center gap-1 pb-2 pt-2.5 text-xs font-medium transition-colors',
                  isActive ? 'text-ink' : 'text-ink-3',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0 h-[3px] w-10 rounded-b-full transition-colors',
                    isActive ? 'bg-fair' : 'bg-transparent',
                  )}
                />
                <Icon className="h-6 w-6" strokeWidth={isActive ? 2.25 : 1.75} />
                {t(label)}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
