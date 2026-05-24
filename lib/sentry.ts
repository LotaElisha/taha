// lib/sentry.ts — Sentry init for the React SPA.
//
// Lazy, opt-in. We only attempt to import @sentry/react when VITE_SENTRY_DSN
// is set; otherwise the side-effect import on app boot becomes a no-op.
// That keeps the dev server from crashing if the package isn't installed
// yet, and keeps Sentry out of the bundle entirely when it's not in use.
//
// The @vite-ignore hint on the dynamic import tells Vite not to try to
// statically resolve the module string at build time — important here
// because we want the dependency to be optional.

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

if (dsn) {
  // Static-looking but ignored by Vite's resolver. The package must be
  // installed if you set the DSN — that's the contract.
  // @ts-ignore — optional dep; types only present when installed.
  import(/* @vite-ignore */ "@sentry/react")
    .then((Sentry: any) => {
      Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        release: (import.meta.env.VITE_RELEASE as string | undefined) ?? "dev",
        tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: import.meta.env.PROD ? 0.25 : 0,
        sendDefaultPii: false,
        integrations: [Sentry.browserTracingIntegration?.()].filter(Boolean),
      });
    })
    .catch((err) => {
      // Not fatal — keep the app running, just log so we know.
      // eslint-disable-next-line no-console
      console.warn(
        "Sentry DSN is set but @sentry/react isn't installed. Run `npm install` or unset VITE_SENTRY_DSN.",
        err
      );
    });
}
