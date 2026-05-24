import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './lib/sentry'; // init Sentry as a side-effect import

// Accessibility audit runs in development only.
// Findings stream to the browser console — fix them as you see them.
if (import.meta.env.DEV && typeof window !== 'undefined') {
  import('@axe-core/react').then(({ default: axe }) => {
    axe(React, ReactDOM, 1000, {
      // Suppress noisy 3rd-party rules that aren't actionable in our code.
      rules: [{ id: 'color-contrast', enabled: true }],
    });
  });
}
import Root from './Root';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { UserProvider } from './context/UserContext';
import { Toaster } from './components/ui/sonner';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <UserProvider>
            <AuthProvider>
              <Root />
              <Toaster />
            </AuthProvider>
          </UserProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);