import * as Sentry from '@sentry/react';
import posthog from 'posthog-js';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const IS_PROD = import.meta.env.PROD;

export function initMonitoring() {
  if (IS_PROD && SENTRY_DSN && !SENTRY_DSN.startsWith('your_')) {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: 'production',
      tracesSampleRate: 0.2,
      replaysOnErrorSampleRate: 1.0,
      integrations: [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],
    });
  }

  if (POSTHOG_KEY && !POSTHOG_KEY.startsWith('your_')) {
    posthog.init(POSTHOG_KEY, {
      api_host: 'https://app.posthog.com',
      capture_pageview: false, // manual tracking via analytics.page()
      loaded: (ph) => {
        if (!IS_PROD) ph.opt_out_capturing();
      },
    });
  }
}

export const analytics = {
  identify(userId: string, traits?: Record<string, unknown>) {
    try {
      posthog.identify(userId, traits);
      Sentry.setUser({ id: userId, ...traits });
    } catch {}
  },

  page(pageName: string, properties?: Record<string, unknown>) {
    try {
      posthog.capture('$pageview', { page: pageName, ...properties });
    } catch {}
  },

  track(event: string, properties?: Record<string, unknown>) {
    try {
      posthog.capture(event, properties);
    } catch {}
  },

  reset() {
    try {
      posthog.reset();
      Sentry.setUser(null);
    } catch {}
  },
};

export { Sentry };
