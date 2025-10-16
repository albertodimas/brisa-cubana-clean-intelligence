"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type StreamEventName =
  | "init"
  | "notification:new"
  | "notification:update"
  | "notification:sync"
  | "ping"
  | "poll"
  | "error";

type UseNotificationStreamOptions = {
  enabled?: boolean;
  onEvent?: (event: StreamEventName, payload: unknown) => void;
  fallbackIntervalMs?: number;
  reconnectBaseDelayMs?: number;
  maxReconnectDelayMs?: number;
  maxRetriesBeforeFallback?: number;
};

type ConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "polling";

export function useNotificationStream({
  enabled = true,
  onEvent,
  fallbackIntervalMs = 60_000,
  reconnectBaseDelayMs = 1_000,
  maxReconnectDelayMs = 30_000,
  maxRetriesBeforeFallback = 3,
}: UseNotificationStreamOptions = {}) {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("idle");
  const [lastEvent, setLastEvent] = useState<StreamEventName | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const refreshDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isUnmountedRef = useRef(false);
  const sentryModuleRef = useRef<typeof import("@sentry/nextjs") | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!sentryModuleRef.current) {
      import("@sentry/nextjs")
        .then((mod) => {
          if (!cancelled) {
            sentryModuleRef.current = mod;
          }
        })
        .catch(() => {
          // Evitar fallos en entornos que deshabilitan Sentry
        });
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const scheduleEventCallback = useCallback(
    (eventName: StreamEventName, payload: unknown) => {
      setLastEvent(eventName);
      if (!onEvent) {
        return;
      }
      if (refreshDebounceRef.current) {
        return;
      }
      refreshDebounceRef.current = setTimeout(() => {
        refreshDebounceRef.current = null;
        onEvent(eventName, payload);
      }, 250);
    },
    [onEvent],
  );

  useEffect(() => {
    if (!enabled) {
      setConnectionState("idle");
      return;
    }

    isUnmountedRef.current = false;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const clearFallbackTimer = () => {
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };

    const cleanupEventSource = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };

    const startFallback = () => {
      if (fallbackTimerRef.current) {
        return;
      }
      setConnectionState("polling");
      sentryModuleRef.current?.captureMessage(
        "notifications.stream.fallback",
        "info",
      );
      fallbackTimerRef.current = setInterval(() => {
        if (isUnmountedRef.current) {
          return;
        }
        scheduleEventCallback("poll", null);
        if (!eventSourceRef.current) {
          reconnectAttemptsRef.current = 0;
          clearReconnectTimer();
          reconnectTimerRef.current = setTimeout(() => {
            startEventSource();
          }, 0);
        }
      }, fallbackIntervalMs);
    };

    const startEventSource = () => {
      if (isUnmountedRef.current || eventSourceRef.current) {
        return;
      }

      clearReconnectTimer();

      setConnectionState(
        reconnectAttemptsRef.current > 0 ? "reconnecting" : "connecting",
      );

      const source = new EventSource("/api/notifications/stream", {
        withCredentials: true,
      });
      eventSourceRef.current = source;

      source.onopen = () => {
        if (isUnmountedRef.current) {
          return;
        }
        reconnectAttemptsRef.current = 0;
        clearFallbackTimer();
        setConnectionState("connected");
      };

      const handleMessage =
        (eventName: StreamEventName) => (event: MessageEvent) => {
          if (isUnmountedRef.current) {
            return;
          }
          let payload: unknown = null;
          if (event.data) {
            try {
              payload = JSON.parse(event.data);
            } catch {
              payload = event.data;
            }
          }
          scheduleEventCallback(eventName, payload);
        };

      source.addEventListener("init", handleMessage("init"));
      source.addEventListener(
        "notification:new",
        handleMessage("notification:new"),
      );
      source.addEventListener(
        "notification:update",
        handleMessage("notification:update"),
      );
      source.addEventListener(
        "notification:sync",
        handleMessage("notification:sync"),
      );
      source.addEventListener("ping", handleMessage("ping"));
      source.addEventListener("error", handleMessage("error"));

      source.onerror = () => {
        cleanupEventSource();
        if (isUnmountedRef.current) {
          return;
        }
        reconnectAttemptsRef.current += 1;
        sentryModuleRef.current?.captureMessage(
          "notifications.stream.error",
          "warning",
        );
        const attempts = reconnectAttemptsRef.current;
        if (attempts >= maxRetriesBeforeFallback) {
          startFallback();
          return;
        }
        const delay = Math.min(
          reconnectBaseDelayMs * 2 ** (attempts - 1),
          maxReconnectDelayMs,
        );
        setConnectionState("reconnecting");
        clearReconnectTimer();
        reconnectTimerRef.current = setTimeout(() => {
          startEventSource();
        }, delay);
      };
    };

    startEventSource();

    return () => {
      isUnmountedRef.current = true;
      cleanupEventSource();
      clearReconnectTimer();
      clearFallbackTimer();
      if (refreshDebounceRef.current) {
        clearTimeout(refreshDebounceRef.current);
        refreshDebounceRef.current = null;
      }
      setConnectionState("idle");
    };
  }, [
    enabled,
    fallbackIntervalMs,
    maxReconnectDelayMs,
    maxRetriesBeforeFallback,
    reconnectBaseDelayMs,
    scheduleEventCallback,
  ]);

  useEffect(() => {
    if (!sentryModuleRef.current) {
      return;
    }
    sentryModuleRef.current.addBreadcrumb({
      category: "notifications.stream",
      message: `connection_state:${connectionState}`,
      level: connectionState === "polling" ? "warning" : "info",
    });
  }, [connectionState]);

  useEffect(() => {
    if (!sentryModuleRef.current || !lastEvent) {
      return;
    }
    if (lastEvent === "error") {
      sentryModuleRef.current.captureMessage(
        "notifications.stream.event.error",
        "warning",
      );
    }
  }, [lastEvent]);

  return {
    connectionState,
    lastEvent,
    isUsingFallback: connectionState === "polling",
    reconnectAttempts: reconnectAttemptsRef.current,
  };
}

export type {
  ConnectionState as NotificationStreamConnectionState,
  StreamEventName as NotificationStreamEvent,
};
