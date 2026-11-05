import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isAuthError, isAuthRetryableFetchError, type User } from '@supabase/supabase-js';
import { GOOGLE_AUTH_ENABLED, supabase } from '../lib/supabase';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: number;
}

/** Códigos de erro traduzidos nas telas (auth.err*) */
export type AuthErrorCode =
  | 'invalidCredentials'
  | 'emailInUse'
  | 'emailNotConfirmed'
  | 'weakPassword'
  | 'samePassword'
  | 'rateLimit'
  | 'linkExpired'
  | 'network'
  | 'generic';

export class AuthError extends Error {
  constructor(public code: AuthErrorCode) {
    super(code);
  }
}

export interface SignUpResult {
  user: AuthUser | null;
  /** O Supabase mandou um e-mail de confirmação: a conta só entra depois do clique no link */
  needsConfirmation: boolean;
}

interface AuthValue {
  user: AuthUser | null;
  /** false enquanto a sessão salva ainda está sendo lida (evita piscar "Entrar" para quem já está logado) */
  ready: boolean;
  /** true enquanto as contas ficam só no aparelho (Supabase não configurado) */
  isLocalOnly: boolean;
  googleEnabled: boolean;
  /** Chegou pelo link de "esqueci minha senha": pode definir a nova senha */
  recovering: boolean;
  signUp: (name: string, email: string, password: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  return supabase ? <SupabaseAuthProvider>{children}</SupabaseAuthProvider> : <LocalAuthProvider>{children}</LocalAuthProvider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Supabase                                                            */
/* ------------------------------------------------------------------ */

/** Para onde os links dos e-mails levam (precisam estar em Authentication → URL Configuration) */
const redirectTo = (path: string) => `${window.location.origin}${path}`;

function toAuthUser(user: User): AuthUser {
  const meta = user.user_metadata as { name?: string; full_name?: string };
  return {
    id: user.id,
    name: meta.name || meta.full_name || (user.email ?? '').split('@')[0],
    email: user.email ?? '',
    createdAt: Date.parse(user.created_at),
  };
}

const ERROR_CODES: Record<string, AuthErrorCode> = {
  invalid_credentials: 'invalidCredentials',
  user_already_exists: 'emailInUse',
  email_exists: 'emailInUse',
  email_not_confirmed: 'emailNotConfirmed',
  weak_password: 'weakPassword',
  same_password: 'samePassword',
  over_email_send_rate_limit: 'rateLimit',
  over_request_rate_limit: 'rateLimit',
  otp_expired: 'linkExpired',
  session_not_found: 'linkExpired',
};

function toAuthError(error: unknown): AuthError {
  if (isAuthRetryableFetchError(error)) return new AuthError('network');
  if (isAuthError(error)) return new AuthError(ERROR_CODES[error.code ?? ''] ?? 'generic');
  return new AuthError('generic');
}

function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const client = supabase!;
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    // INITIAL_SESSION chega primeiro, com a sessão salva (ou a que veio no link do e-mail)
    const { data } = client.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ? toAuthUser(session.user) : null);
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      if (event === 'SIGNED_OUT') setRecovering(false);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, [client]);

  const signUp = useCallback(
    async (name: string, email: string, password: string): Promise<SignUpResult> => {
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim() }, emailRedirectTo: redirectTo('/app') },
      });
      if (error) throw toAuthError(error);
      // Com confirmação de e-mail ligada, um e-mail já cadastrado volta "sem identidades" em vez de erro
      if (data.user && data.user.identities?.length === 0) throw new AuthError('emailInUse');
      return { user: data.user ? toAuthUser(data.user) : null, needsConfirmation: !data.session };
    },
    [client],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw toAuthError(error);
      return toAuthUser(data.user);
    },
    [client],
  );

  const signInWithGoogle = useCallback(async () => {
    const { error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTo('/app') } });
    if (error) throw toAuthError(error);
  }, [client]);

  const signOut = useCallback(async () => {
    // scope 'local': sai só deste aparelho; mesmo sem internet a sessão local é apagada
    await client.auth.signOut({ scope: 'local' });
    setUser(null);
  }, [client]);

  const requestPasswordReset = useCallback(
    async (email: string) => {
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectTo('/nova-senha') });
      // Não revelamos se a conta existe: só falta de internet e excesso de pedidos viram erro
      if (error) {
        const failure = toAuthError(error);
        if (failure.code === 'network' || failure.code === 'rateLimit') throw failure;
      }
    },
    [client],
  );

  const resendConfirmation = useCallback(
    async (email: string) => {
      const { error } = await client.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: redirectTo('/app') } });
      if (error) throw toAuthError(error);
    },
    [client],
  );

  const updatePassword = useCallback(
    async (password: string) => {
      const { error } = await client.auth.updateUser({ password });
      if (error) throw toAuthError(error);
      setRecovering(false);
    },
    [client],
  );

  const value = useMemo<AuthValue>(
    () => ({
      user,
      ready,
      isLocalOnly: false,
      googleEnabled: GOOGLE_AUTH_ENABLED,
      recovering,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      requestPasswordReset,
      resendConfirmation,
      updatePassword,
    }),
    [user, ready, recovering, signUp, signIn, signInWithGoogle, signOut, requestPasswordReset, resendConfirmation, updatePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ------------------------------------------------------------------ */
/* Contas provisórias, só neste navegador (sem Supabase configurado)    */
/* ------------------------------------------------------------------ */

const USERS_KEY = 'isfair:auth-users';
const SESSION_KEY = 'isfair:auth-session';

interface StoredUser extends AuthUser {
  salt: string;
  passwordHash: string;
}

const readUsers = (): Record<string, StoredUser> => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? '{}') as Record<string, StoredUser>;
  } catch {
    return {};
  }
};

const writeUsers = (users: Record<string, StoredUser>) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

const toHex = (buffer: ArrayBuffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function hashPassword(password: string, salt: string): Promise<string> {
  // crypto.subtle só existe em HTTPS/localhost; fora disso (dev pela rede local) usa um hash simples
  if (!crypto?.subtle) {
    let h = 0;
    for (const ch of salt + password) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0;
    return `weak-${h}`;
  }
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100_000, hash: 'SHA-256' },
    key,
    256,
  );
  return toHex(bits);
}

const randomId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const publicUser = ({ id, name, email, createdAt }: StoredUser): AuthUser => ({ id, name, email, createdAt });

function readSession(): AuthUser | null {
  try {
    const id = localStorage.getItem(SESSION_KEY);
    const user = id ? Object.values(readUsers()).find((u) => u.id === id) : undefined;
    return user ? publicUser(user) : null;
  } catch {
    return null;
  }
}

function LocalAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readSession);

  const startSession = (stored: StoredUser) => {
    localStorage.setItem(SESSION_KEY, stored.id);
    const next = publicUser(stored);
    setUser(next);
    return next;
  };

  const signUp = useCallback(async (name: string, email: string, password: string): Promise<SignUpResult> => {
    const key = email.trim().toLowerCase();
    const users = readUsers();
    if (users[key]) throw new AuthError('emailInUse');
    const salt = randomId();
    const stored: StoredUser = {
      id: randomId(),
      name: name.trim(),
      email: key,
      createdAt: Date.now(),
      salt,
      passwordHash: await hashPassword(password, salt),
    };
    writeUsers({ ...users, [key]: stored });
    return { user: startSession(stored), needsConfirmation: false };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const stored = readUsers()[email.trim().toLowerCase()];
    if (!stored || (await hashPassword(password, stored.salt)) !== stored.passwordHash) {
      throw new AuthError('invalidCredentials');
    }
    return startSession(stored);
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  // Sem servidor de e-mail: a tela mostra a confirmação de qualquer forma (não revela se a conta existe)
  const noop = useCallback(async () => {}, []);
  const unavailable = useCallback(async () => {
    throw new AuthError('generic');
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      ready: true,
      isLocalOnly: true,
      googleEnabled: false,
      recovering: false,
      signUp,
      signIn,
      signInWithGoogle: unavailable,
      signOut,
      requestPasswordReset: noop,
      resendConfirmation: noop,
      updatePassword: unavailable,
    }),
    [user, signUp, signIn, signOut, noop, unavailable],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
