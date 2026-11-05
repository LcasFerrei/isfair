import { Check } from 'lucide-react';
import { LANGUAGES, useI18n } from '../i18n';
import { cn } from '../lib/cn';
import { FlagCircle } from './ui/Flag';
import { Sheet } from './ui/Sheet';

/** Lista de idiomas (usada no app e na landing page). */
export function LanguageSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang, setLang } = useI18n();
  return (
    <Sheet open={open} onClose={onClose} title={t('language.title')}>
      <ul className="divide-y divide-line">
        {LANGUAGES.map((l) => {
          const selected = l.code === lang;
          return (
            <li key={l.code}>
              <button
                type="button"
                onClick={() => {
                  setLang(l.code);
                  onClose();
                }}
                aria-current={selected ? 'true' : undefined}
                className="-mx-5 flex w-[calc(100%+2.5rem)] items-center gap-4 px-5 py-3 text-start transition-colors hover:bg-muted"
              >
                <FlagCircle code={l.flag} />
                <span className="min-w-0 flex-1 font-semibold">
                  {/* bdi: o nome do idioma usa a própria direção sem empurrar a linha toda */}
                  <bdi lang={l.code} dir={l.dir}>
                    {l.name}
                  </bdi>
                </span>
                <Check className={cn('h-5 w-5 shrink-0', !selected && 'invisible')} strokeWidth={2.5} />
              </button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
