import { useId, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { ArrowLeft, Eye, EyeOff, Info, Loader2, Lock, Mail, MailCheck, User, type LucideIcon } from 'lucide-react';
import { AuthError, useAuth, type AuthErrorCode } from '../auth/AuthContext';
import { LanguageSheet } from '../components/LanguageSheet';
import { Logo } from '../components/Logo';
import { Banknote } from '../components/Money';
import { Flag } from '../components/ui/Flag';
import { BANKNOTES } from '../data/mockData';
import { useI18n, type UiKey } from '../i18n';
import { cn } from '../lib/cn';
import { Link, useRouter } from '../router';

export type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

const ERROR_KEYS: Record<AuthErrorCode, UiKey> = {
  invalidCredentials: 'auth.errInvalidCredentials',
  emailInUse: 'auth.errEmailInUse',
  emailNotConfirmed: 'auth.errEmailNotConfirmed',
  weakPassword: 'auth.errWeakPassword',
  samePassword: 'auth.errSamePassword',
  rateLimit: 'auth.errRateLimit',
  linkExpired: 'auth.errLinkExpired',
  network: 'auth.errNetwork',
  generic: 'auth.errGeneric',
};

const errorKey = (error: unknown) => ERROR_KEYS[error instanceof AuthError ? error.code : 'generic'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 8;
const SUCCESS_REDIRECT_MS = 900;

type Field = 'name' | 'email' | 'password' | 'terms';
type Errors = Partial<Record<Field | 'form', UiKey>>;

/** 0 a 4: tamanho, maiúsculas e minúsculas, números e símbolos */
function passwordScore(password: string) {
  let score = 0;
  if (password.length >= MIN_PASSWORD) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

export function AuthPage({ mode }: { mode: AuthMode }) {
  const { t, info } = useI18n();
  const [langOpen, setLangOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-white md:grid md:grid-cols-[1fr_1.1fr]">
      <SidePanel />

      <div className="flex min-h-dvh flex-col px-5 pb-10 pt-5 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="landing" aria-label="IsFair" className="md:invisible">
            <Logo />
          </Link>
          <button
            type="button"
            onClick={() => setLangOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-sm font-semibold transition-colors hover:border-ink-3"
            aria-label={t('language.title')}
          >
            <Flag code={info.flag} className="h-3.5" />
            <span className="uppercase">{info.api}</span>
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-8">
          {/* key: ao trocar de modo o formulário entra de novo com animação */}
          <div key={mode} className="animate-fade-in">
            {mode === 'forgot' ? <ForgotForm /> : mode === 'reset' ? <ResetForm /> : <CredentialsForm mode={mode} />}
          </div>
        </div>
      </div>

      <LanguageSheet open={langOpen} onClose={() => setLangOpen(false)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Painel azul-marinho (só em telas largas) com as cédulas flutuando. */
function SidePanel() {
  const { t } = useI18n();
  const notes = [BANKNOTES[6], BANKNOTES[4], BANKNOTES[2]];
  return (
    <aside className="relative hidden overflow-hidden bg-ink p-10 text-white md:flex md:flex-col">
      <div aria-hidden className="pointer-events-none absolute -end-24 -top-24 h-80 w-80 rounded-full bg-fair/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -start-24 h-80 w-80 rounded-full bg-tourist/15 blur-3xl" />
      <Link to="landing" aria-label="IsFair" className="relative">
        <Logo inverted />
      </Link>
      <div className="relative my-auto">
        <div className="relative mx-auto h-56 w-72">
          {notes.map((note, i) => (
            <span
              key={note.value}
              className={cn('absolute block w-56 motion-safe:animate-float', i === 1 && 'motion-safe:animate-float-slow')}
              style={{
                left: `${i * 18}px`,
                top: `${i * 46}px`,
                transform: `rotate(${(i - 1) * 8}deg)`,
                animationDelay: `${i * 0.8}s`,
              }}
            >
              <Banknote denom={note} />
            </span>
          ))}
        </div>
        <h2 className="mt-10 text-3xl font-extrabold tracking-tight">{t('auth.sideTitle')}</h2>
        <p className="mt-3 max-w-sm text-lg text-white/70">{t('auth.sideText')}</p>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */

function CredentialsForm({ mode }: { mode: 'login' | 'signup' }) {
  const { t } = useI18n();
  const { signIn, signUp, signInWithGoogle, googleEnabled, resendConfirmation, isLocalOnly } = useAuth();
  const { navigate } = useRouter();
  const isSignup = mode === 'signup';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  /** Incrementa a cada erro para o campo "tremer" de novo */
  const [shakeKey, setShakeKey] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'confirm'>('idle');
  /** Login barrado por e-mail não confirmado: oferece reenviar o link */
  const [unconfirmed, setUnconfirmed] = useState(false);

  const validate = (): Errors => {
    const next: Errors = {};
    if (isSignup && !name.trim()) next.name = 'auth.errName';
    if (!EMAIL_RE.test(email.trim())) next.email = 'auth.errEmail';
    if (password.length < MIN_PASSWORD) next.password = 'auth.errPassword';
    if (isSignup && !terms) next.terms = 'auth.errTerms';
    return next;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setShakeKey((k) => k + 1);
      return;
    }
    setStatus('loading');
    setUnconfirmed(false);
    try {
      if (isSignup) {
        const { needsConfirmation } = await signUp(name, email, password);
        if (needsConfirmation) {
          setStatus('confirm');
          return;
        }
      } else {
        await signIn(email, password);
      }
      setStatus('success');
      window.setTimeout(() => navigate('app'), SUCCESS_REDIRECT_MS);
    } catch (error) {
      setErrors({ form: errorKey(error) });
      setUnconfirmed(error instanceof AuthError && error.code === 'emailNotConfirmed');
      setShakeKey((k) => k + 1);
      setStatus('idle');
    }
  };

  if (status === 'success') return <SuccessState />;
  if (status === 'confirm') return <CheckEmail email={email.trim()} onResend={() => resendConfirmation(email)} />;

  const clear = (field: Field) => setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));

  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">{t(isSignup ? 'auth.signupTitle' : 'auth.loginTitle')}</h1>
      <p className="mt-2 text-ink-2">{t(isSignup ? 'auth.signupSubtitle' : 'auth.loginSubtitle')}</p>

      {isLocalOnly && (
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-muted px-4 py-3 text-sm text-ink-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" /> {t('auth.localNotice')}
        </p>
      )}

      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        {isSignup && (
          <TextField
            icon={User}
            label={t('auth.name')}
            error={errors.name && t(errors.name)}
            shakeKey={shakeKey}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clear('name');
            }}
            placeholder={t('auth.namePlaceholder')}
            autoComplete="name"
            autoFocus
          />
        )}
        <TextField
          icon={Mail}
          label={t('auth.email')}
          error={errors.email && t(errors.email)}
          shakeKey={shakeKey}
          type="email"
          inputMode="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clear('email');
          }}
          placeholder={t('auth.emailPlaceholder')}
          autoComplete="email"
          autoFocus={!isSignup}
          dir="ltr"
        />
        <PasswordField
          value={password}
          onChange={(value) => {
            setPassword(value);
            clear('password');
          }}
          error={errors.password && t(errors.password)}
          shakeKey={shakeKey}
          showStrength={isSignup}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
        />

        {!isSignup && (
          <div className="-mt-1 text-end">
            <Link to="forgot" className="text-sm font-semibold text-ink-2 underline-offset-2 hover:text-ink hover:underline">
              {t('auth.forgot')}
            </Link>
          </div>
        )}

        {isSignup && (
          <div key={errors.terms ? `terms-${shakeKey}` : 'terms'} className={cn(errors.terms && 'animate-shake')}>
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => {
                  setTerms(e.target.checked);
                  clear('terms');
                }}
                className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded accent-ink"
              />
              <span className={errors.terms ? 'text-abusive-text' : 'text-ink-2'}>{t('auth.acceptTerms')}</span>
            </label>
            {/* Em outra aba: quem está se cadastrando não perde o que já digitou */}
            <p className="ms-8 mt-1.5 flex gap-4 text-sm">
              <a href="/termos" target="_blank" rel="noopener" className="font-semibold text-ink underline underline-offset-4">
                {t('landing.terms')}
              </a>
              <a href="/privacidade" target="_blank" rel="noopener" className="font-semibold text-ink underline underline-offset-4">
                {t('landing.privacy')}
              </a>
            </p>
          </div>
        )}

        {errors.form && (
          <div key={`form-${shakeKey}`} role="alert" className="animate-shake rounded-xl bg-abusive/10 px-4 py-3 text-sm font-medium text-abusive-text">
            {t(errors.form)}
            {unconfirmed && <ResendButton onResend={() => resendConfirmation(email)} className="mt-2 block" />}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-ink text-lg font-semibold text-white transition-all hover:bg-ink/90 active:scale-[0.99] disabled:opacity-80"
        >
          {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
          {t(isSignup ? 'auth.signupButton' : 'auth.loginButton')}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-sm text-ink-3">
        <span className="h-px flex-1 bg-line" />
        {t('auth.or')}
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="space-y-2">
        {/* Leva à tela do Google e volta logado para /app */}
        <button
          type="button"
          disabled={!googleEnabled}
          onClick={() =>
            signInWithGoogle().catch((error: unknown) => {
              setErrors({ form: errorKey(error) });
              setShakeKey((k) => k + 1);
            })
          }
          className={cn(
            'flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-line font-semibold',
            googleEnabled ? 'transition-colors hover:bg-muted' : 'text-ink-2',
          )}
        >
          <GoogleIcon />
          {t('auth.google')}
          {!googleEnabled && <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{t('common.soon')}</span>}
        </button>
        <Link
          to="app"
          className="flex h-12 w-full items-center justify-center rounded-xl bg-muted font-semibold transition-colors hover:bg-muted-2"
        >
          {t('auth.guest')}
        </Link>
      </div>

      <p className="mt-8 text-center text-ink-2">
        {t(isSignup ? 'auth.hasAccount' : 'auth.noAccount')}{' '}
        <Link to={isSignup ? 'login' : 'signup'} className="font-semibold text-ink underline-offset-2 hover:underline">
          {t(isSignup ? 'auth.loginButton' : 'auth.signupButton')}
        </Link>
      </p>
    </>
  );
}

function ForgotForm() {
  const { t } = useI18n();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<UiKey | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError('auth.errEmail');
      setShakeKey((k) => k + 1);
      return;
    }
    setStatus('loading');
    try {
      await requestPasswordReset(email.trim());
      setStatus('sent');
    } catch (failure) {
      setError(errorKey(failure));
      setShakeKey((k) => k + 1);
      setStatus('idle');
    }
  };

  return (
    <>
      <Link to="login" className="-ms-2 mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted" aria-label={t('auth.backToLogin')}>
        <ArrowLeft className="h-5 w-5 rtl:-scale-x-100" />
      </Link>
      <h1 className="text-3xl font-extrabold tracking-tight">{t('auth.forgotTitle')}</h1>
      <p className="mt-2 text-ink-2">{t('auth.forgotSubtitle')}</p>

      {status === 'sent' ? (
        <div className="mt-8 animate-fade-in text-center">
          <AnimatedCheck />
          <p className="mt-5 text-ink-2">{t('auth.linkSent', { email: email.trim() })}</p>
          <Link to="login" className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-ink px-6 font-semibold text-white">
            {t('auth.backToLogin')}
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mt-6 space-y-4">
          <TextField
            icon={Mail}
            label={t('auth.email')}
            error={error ? t(error) : undefined}
            shakeKey={shakeKey}
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            placeholder={t('auth.emailPlaceholder')}
            autoComplete="email"
            autoFocus
            dir="ltr"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-ink text-lg font-semibold text-white transition-all hover:bg-ink/90 disabled:opacity-80"
          >
            {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
            {t('auth.sendLink')}
          </button>
        </form>
      )}
    </>
  );
}

/** Destino do link de "esqueci minha senha": define a nova senha e entra no app. */
function ResetForm() {
  const { t } = useI18n();
  const { user, ready, updatePassword } = useAuth();
  const { navigate } = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<UiKey | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  if (status === 'success') return <SuccessState />;

  if (!ready) {
    return (
      <div className="grid place-items-center py-16" aria-busy="true">
        <Loader2 className="h-8 w-8 animate-spin text-ink-3" />
      </div>
    );
  }

  // Sem sessão: o link expirou, já foi usado ou a página foi aberta direto
  if (!user) {
    return (
      <>
        <h1 className="text-3xl font-extrabold tracking-tight">{t('auth.resetTitle')}</h1>
        <p className="mt-4 rounded-xl bg-abusive/10 px-4 py-3 text-sm font-medium text-abusive-text">{t('auth.errLinkExpired')}</p>
        <Link to="forgot" className="mt-6 flex h-14 items-center justify-center rounded-xl bg-ink text-lg font-semibold text-white">
          {t('auth.sendNewLink')}
        </Link>
      </>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) {
      setError('auth.errPassword');
      setShakeKey((k) => k + 1);
      return;
    }
    setStatus('loading');
    try {
      await updatePassword(password);
      setStatus('success');
      window.setTimeout(() => navigate('app'), SUCCESS_REDIRECT_MS);
    } catch (failure) {
      setError(errorKey(failure));
      setShakeKey((k) => k + 1);
      setStatus('idle');
    }
  };

  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight">{t('auth.resetTitle')}</h1>
      <p className="mt-2 text-ink-2">{t('auth.resetSubtitle', { email: user.email })}</p>
      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        <PasswordField
          value={password}
          onChange={(value) => {
            setPassword(value);
            setError(null);
          }}
          error={error ? t(error) : undefined}
          shakeKey={shakeKey}
          showStrength
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-ink text-lg font-semibold text-white transition-all hover:bg-ink/90 disabled:opacity-80"
        >
          {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
          {t('auth.resetButton')}
        </button>
      </form>
    </>
  );
}

/** Depois do cadastro: a conta só entra depois do clique no link enviado por e-mail. */
function CheckEmail({ email, onResend }: { email: string; onResend: () => Promise<void> }) {
  const { t } = useI18n();
  return (
    <div className="animate-fade-in text-center" role="status">
      <span className="mx-auto grid h-20 w-20 animate-scale-in place-items-center rounded-full bg-fair">
        <MailCheck className="h-9 w-9 text-ink" />
      </span>
      <h1 className="mt-6 text-2xl font-extrabold tracking-tight">{t('auth.checkEmailTitle')}</h1>
      <p className="mt-3 text-ink-2">{t('auth.checkEmailText', { email })}</p>
      <p className="mt-2 text-sm text-ink-3">{t('auth.checkEmailSpam')}</p>
      <ResendButton onResend={onResend} className="mt-6" />
      <Link to="login" className="mt-3 flex h-12 items-center justify-center rounded-xl bg-muted font-semibold transition-colors hover:bg-muted-2">
        {t('auth.backToLogin')}
      </Link>
    </div>
  );
}

/** Reenvia o e-mail de confirmação, com espera entre tentativas (o Supabase limita os envios). */
function ResendButton({ onResend, className }: { onResend: () => Promise<void>; className?: string }) {
  const { t } = useI18n();
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  return (
    <span className={className}>
      <button
        type="button"
        disabled={state === 'sending' || state === 'sent'}
        onClick={() => {
          setState('sending');
          onResend()
            .then(() => setState('sent'))
            .catch(() => setState('error'));
        }}
        className="inline-flex items-center gap-1.5 font-semibold text-ink underline underline-offset-4 disabled:no-underline disabled:opacity-70"
      >
        {state === 'sending' && <Loader2 className="h-4 w-4 animate-spin" />}
        {state === 'sent' ? t('auth.resent') : t('auth.resendEmail')}
      </button>
      {state === 'error' && <span className="mt-1 block text-sm text-abusive-text">{t('auth.errRateLimit')}</span>}
    </span>
  );
}

/* ------------------------------------------------------------------ */

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: LucideIcon;
  label: string;
  error?: string;
  shakeKey: number;
  trailing?: ReactNode;
}

function TextField({ icon: Icon, label, error, shakeKey, trailing, id, ...input }: TextFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div key={error ? `err-${shakeKey}` : 'ok'} className={cn(error && 'animate-shake')}>
      <label htmlFor={fieldId} className="text-sm font-medium text-ink-2">
        {label}
      </label>
      <div
        className={cn(
          'mt-1.5 flex h-12 items-center gap-3 rounded-xl bg-muted px-4 ring-inset transition-all focus-within:bg-white focus-within:ring-2',
          error ? 'ring-2 ring-abusive focus-within:ring-abusive' : 'focus-within:ring-ink',
        )}
      >
        <Icon className={cn('h-5 w-5 shrink-0', error ? 'text-abusive-text' : 'text-ink-3')} />
        <input
          id={fieldId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-3"
          {...input}
        />
        {trailing}
      </div>
      {error && (
        <p id={`${fieldId}-error`} className="mt-1.5 animate-fade-in text-sm font-medium text-abusive-text">
          {error}
        </p>
      )}
    </div>
  );
}

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  shakeKey: number;
  showStrength: boolean;
  autoComplete: string;
}

function PasswordField({ value, onChange, error, shakeKey, showStrength, autoComplete }: PasswordFieldProps) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const score = passwordScore(value);
  const level = score <= 1 ? 'weak' : score <= 3 ? 'medium' : 'strong';
  const levelColor = level === 'weak' ? 'bg-abusive' : level === 'medium' ? 'bg-tourist' : 'bg-fair';
  const filled = level === 'weak' ? 1 : level === 'medium' ? 2 : 3;

  return (
    <div>
      <TextField
        icon={Lock}
        label={t('auth.password')}
        error={error}
        shakeKey={shakeKey}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('auth.passwordPlaceholder')}
        autoComplete={autoComplete}
        dir="ltr"
        trailing={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={t(visible ? 'auth.hidePassword' : 'auth.showPassword')}
            className="grid h-8 w-8 place-items-center rounded-full text-ink-2 transition-colors hover:bg-muted-2"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      />
      {showStrength && value && (
        <div className="mt-2 animate-fade-in">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((i) => (
              <span key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors duration-300', i <= filled ? levelColor : 'bg-muted-2')} />
            ))}
          </div>
          <p className="mt-1 text-xs text-ink-2">
            {t('auth.strength', {
              level: t(level === 'weak' ? 'auth.strengthWeak' : level === 'medium' ? 'auth.strengthMedium' : 'auth.strengthStrong'),
            })}
          </p>
        </div>
      )}
    </div>
  );
}

function AnimatedCheck() {
  return (
    <span className="mx-auto grid h-20 w-20 animate-scale-in place-items-center rounded-full bg-fair">
      <svg viewBox="0 0 24 24" className="h-10 w-10" aria-hidden>
        <path
          d="M5 12.5l4.5 4.5L19 7.5"
          fill="none"
          stroke="#0B1B3D"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="24"
          className="animate-check-draw"
        />
      </svg>
    </span>
  );
}

function SuccessState() {
  const { t } = useI18n();
  return (
    <div className="animate-fade-in py-10 text-center" role="status">
      <AnimatedCheck />
      <p className="mt-5 text-xl font-bold">{t('auth.success')}</p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}
