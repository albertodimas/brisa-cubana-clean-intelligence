import { getSentryIfLoaded, loadSentry } from "./lib/sentry/lazy";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;
const environment =
  process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
  process.env.SENTRY_ENVIRONMENT ??
  process.env.NODE_ENV ??
  "development";

const tracesSampleRate = Number(
  process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ??
    process.env.SENTRY_TRACES_SAMPLE_RATE ??
    (process.env.NODE_ENV === "production" ? "0.1" : "1.0"),
);

const shouldEnable =
  typeof window !== "undefined" &&
  Boolean(dsn) &&
  process.env.NODE_ENV !== "test";

const enableReplay =
  process.env.NEXT_PUBLIC_SENTRY_REPLAY_ENABLED === "true" ||
  process.env.SENTRY_REPLAY_ENABLED === "true";

const replaySessionRate = Number(
  process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE ??
    process.env.SENTRY_REPLAYS_SESSION_SAMPLE_RATE ??
    "0",
);

const replayErrorRate = Number(
  process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE ??
    process.env.SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE ??
    "0",
);

let initialized = false;
type RouterTransitionHandler = (...args: unknown[]) => void;

let routerTransitionHandler: RouterTransitionHandler = () => {};

const refreshRouterHandler = () => {
  const sentry = getSentryIfLoaded();
  const handler = sentry?.captureRouterTransitionStart;
  if (typeof handler === "function") {
    routerTransitionHandler = handler as RouterTransitionHandler;
  }
};

const initializeSentry = async () => {
  if (initialized) {
    return;
  }

  const Sentry = await loadSentry();

  Sentry.init({
    dsn: dsn || undefined,
    enabled: true,
    environment,
    tracesSampleRate: Number.isNaN(tracesSampleRate) ? 0 : tracesSampleRate,
    profilesSampleRate: 0,
    debug: process.env.NODE_ENV === "development",
    integrations: (integrations) => {
      if (enableReplay) {
        return integrations;
      }
      return integrations.filter(
        (integration) => integration.name !== "Replay",
      );
    },
    replaysSessionSampleRate:
      enableReplay && !Number.isNaN(replaySessionRate) ? replaySessionRate : 0,
    replaysOnErrorSampleRate:
      enableReplay && !Number.isNaN(replayErrorRate) ? replayErrorRate : 0,
  });

  initialized = true;
  refreshRouterHandler();
};

if (shouldEnable) {
  const load = () => {
    initializeSentry().catch((error) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[Sentry] failed to initialize", error);
      }
    });
  };

  const idle = (
    window as typeof window & {
      requestIdleCallback?: (cb: IdleRequestCallback) => number;
    }
  ).requestIdleCallback;

  if (typeof idle === "function") {
    idle(load);
  } else {
    setTimeout(load, 0);
  }
}

export const onRouterTransitionStart: RouterTransitionHandler = (...args) =>
  routerTransitionHandler(...args);

// Intenta resolver el handler inmediatamente si el módulo ya está cargado
refreshRouterHandler();
