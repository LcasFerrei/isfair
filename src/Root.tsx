import { Suspense, lazy } from 'react';
import { LogoMark } from './components/Logo';
import { useRouter } from './router';

// Cada página carrega só quando é aberta: a landing não baixa o app inteiro, e vice-versa.
const App = lazy(() => import('./App'));
const Landing = lazy(() => import('./pages/Landing').then((m) => ({ default: m.Landing })));
const AuthPage = lazy(() => import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })));
const LandingV2 = lazy(() => import('./pages/LandingV2').then((m) => ({ default: m.LandingV2 })));
const LegalPage = lazy(() => import('./pages/LegalPage').then((m) => ({ default: m.LegalPage })));

function PageLoader() {
  return (
    <div className="grid min-h-dvh place-items-center bg-white">
      <LogoMark className="h-12 w-12 motion-safe:animate-breathe" />
    </div>
  );
}

/** Escolhe a página pela rota: landing, app ou telas de conta. */
export function Root() {
  const { route } = useRouter();
  return (
    <Suspense fallback={<PageLoader />}>
      {route === 'app' ? (
        <App />
      ) : route === 'login' || route === 'signup' || route === 'forgot' || route === 'reset' ? (
        <AuthPage mode={route} />
      ) : route === 'landingV2' ? (
        <LandingV2 />
      ) : route === 'terms' || route === 'privacy' ? (
        <LegalPage doc={route} />
      ) : (
        <Landing />
      )}
    </Suspense>
  );
}
