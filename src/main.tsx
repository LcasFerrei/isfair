import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './auth/AuthContext';
import { I18nProvider } from './i18n';
import { Root } from './Root';
import { RouterProvider } from './router';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <AuthProvider>
        <RouterProvider>
          <Root />
        </RouterProvider>
      </AuthProvider>
    </I18nProvider>
  </StrictMode>,
);
