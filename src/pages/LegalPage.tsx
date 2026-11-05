import { useEffect } from 'react';
import { ArrowLeft, FileText, Languages, ShieldCheck } from 'lucide-react';
import { Logo } from '../components/Logo';
import { CONTACT_EMAIL, LEGAL_UPDATED_AT } from '../config';
import { useI18n } from '../i18n';
import { cn } from '../lib/cn';
import { LEGAL, type LegalDoc } from '../legal/content';
import { Link, useRouter } from '../router';

/** Troca {email} por um link de e-mail */
function withEmail(text: string) {
  const parts = text.split('{email}');
  return parts.flatMap((part, i) =>
    i === 0
      ? [part]
      : [
          <a key={i} href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-ink underline underline-offset-4" dir="ltr">
            {CONTACT_EMAIL}
          </a>,
          part,
        ],
  );
}

/** Termos de uso e Política de privacidade: páginas públicas (/termos e /privacidade). */
export function LegalPage({ doc }: { doc: LegalDoc }) {
  const { t, lang, info } = useI18n();
  const { navigate } = useRouter();
  // Português é a versão oficial; os demais idiomas leem a tradução em inglês
  const docLang = lang === 'pt-BR' ? 'pt' : 'en';
  const content = LEGAL[doc][docLang];
  const updated = new Intl.DateTimeFormat(info.intl, { dateStyle: 'long' }).format(new Date(`${LEGAL_UPDATED_AT}T12:00:00`));

  useEffect(() => {
    document.title = `${content.title} · IsFair`;
    return () => {
      document.title = 'IsFair — Street Price & Cash Shield';
    };
  }, [content.title]);

  const goBack = () => {
    // Veio de dentro do site: volta para onde estava; link direto: vai para a página inicial
    if (window.history.length > 1 && document.referrer.startsWith(window.location.origin)) window.history.back();
    else navigate('landing');
  };

  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={goBack}
            aria-label={t('common.back')}
            className="-ms-2 grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-6 w-6 rtl:-scale-x-100" />
          </button>
          <Link to="landing" aria-label="IsFair">
            <Logo />
          </Link>
        </div>
        <nav className="mx-auto flex max-w-3xl gap-2 px-4 pb-3 sm:px-6" aria-label={t('menu.terms')}>
          {(
            [
              ['terms', FileText, t('landing.terms')],
              ['privacy', ShieldCheck, t('landing.privacy')],
            ] as const
          ).map(([id, Icon, label]) => (
            <Link
              key={id}
              to={id}
              aria-current={doc === id ? 'page' : undefined}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors',
                doc === id ? 'bg-ink text-white' : 'bg-muted hover:bg-muted-2',
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
      </header>

      <main key={doc} className="mx-auto max-w-3xl animate-fade-in px-4 pb-20 pt-8 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{content.title}</h1>
        <p className="mt-2 text-sm text-ink-2">{t('legal.updated', { date: updated })}</p>

        {docLang !== 'pt' && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-muted px-4 py-3 text-sm text-ink-2">
            <Languages className="mt-0.5 h-4 w-4 shrink-0" /> {t('legal.languageNotice')}
          </p>
        )}

        {/* O texto segue o idioma do documento (pt ou en), inclusive a direção, também com o app em árabe */}
        <div lang={docLang} dir="ltr" className="text-start">
          <p className="mt-6 text-lg leading-relaxed">{content.intro}</p>

          <nav className="mt-8 rounded-2xl border border-line p-5" aria-label={t('legal.contents')}>
            <p className="text-sm font-semibold text-ink-2">{t('legal.contents')}</p>
            <ol className="mt-2 grid gap-1 sm:grid-cols-2">
              {content.sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="block rounded-md py-1 text-sm font-medium hover:underline">
                    {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {content.sections.map((s) => (
            <section key={s.id} id={s.id} className="mt-10 scroll-mt-36">
              <h2 className="text-xl font-bold tracking-tight">{s.heading}</h2>
              {s.paragraphs.map((p, i) => (
                <p key={i} className="mt-3 leading-relaxed text-ink-2">
                  {withEmail(p)}
                </p>
              ))}
              {s.items && (
                <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
                  {s.items.map(([term, text]) => (
                    <li key={term} className="px-4 py-3 text-sm leading-relaxed">
                      <span className="font-semibold text-ink">{term}:</span> <span className="text-ink-2">{text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-sm text-ink-2">
          <Link to={doc === 'terms' ? 'privacy' : 'terms'} className="font-semibold text-ink underline underline-offset-4">
            {t('legal.readAlso', { doc: doc === 'terms' ? t('landing.privacy') : t('landing.terms') })}
          </Link>
          <p>{t('landing.rights')}</p>
        </div>
      </main>
    </div>
  );
}
