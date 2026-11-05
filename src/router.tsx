import { createContext, useCallback, useContext, useEffect, useState, type AnchorHTMLAttributes, type ReactNode } from 'react';

/** Rotas do site. Sem biblioteca: usa a History API e o servidor devolve o index.html em qualquer caminho. */
export type Route = 'landing' | 'landingV2' | 'app' | 'login' | 'signup' | 'forgot' | 'reset' | 'terms' | 'privacy';

const PATHS: Record<Route, string> = {
  landing: '/',
  // Prévia da página inicial 2.0 (não aparece em nenhum link)
  landingV2: '/v2',
  app: '/app',
  login: '/entrar',
  signup: '/cadastro',
  forgot: '/recuperar-senha',
  // Destino do link de "esqueci minha senha" enviado por e-mail
  reset: '/nova-senha',
  terms: '/termos',
  privacy: '/privacidade',
};

function routeFromPath(path: string): Route {
  const clean = path.replace(/\/+$/, '') || '/';
  const match = (Object.keys(PATHS) as Route[]).find((route) => PATHS[route] === clean);
  return match ?? 'landing';
}

interface RouterValue {
  route: Route;
  navigate: (route: Route) => void;
}

const RouterContext = createContext<RouterValue | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(() => routeFromPath(window.location.pathname));

  useEffect(() => {
    const onPop = () => setRoute(routeFromPath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((next: Route) => {
    if (window.location.pathname !== PATHS[next]) window.history.pushState(null, '', PATHS[next]);
    setRoute(next);
    window.scrollTo({ top: 0 });
  }, []);

  return <RouterContext.Provider value={{ route, navigate }}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterValue {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter precisa estar dentro de <RouterProvider>');
  return ctx;
}

/** Link interno: navega sem recarregar, mas continua sendo um <a> (abrir em nova aba funciona). */
export function Link({ to, onClick, ...props }: { to: Route } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const { navigate } = useRouter();
  return (
    <a
      href={PATHS[to]}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }}
      {...props}
    />
  );
}
