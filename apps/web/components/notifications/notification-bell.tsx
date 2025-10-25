"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { PaginatedResult, Notification } from "@/lib/api";
import { usePaginatedResource } from "@/hooks/use-paginated-resource";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions";
import type { ActionResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  useNotificationStream,
  type NotificationStreamEvent,
} from "@/hooks/use-notification-stream";

type NotificationBellProps = {
  initialNotifications: PaginatedResult<Notification>;
};

const formatter = new Intl.DateTimeFormat("es-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function NotificationBell({
  initialNotifications,
}: NotificationBellProps) {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingNotificationId, setPendingNotificationId] = useState<
    string | null
  >(null);
  const [viewUnreadOnly, setViewUnreadOnly] = useState(false);
  const [isMarkingAll, startMarkAll] = useTransition();
  const {
    items,
    pageInfo,
    isLoading,
    isLoadingMore,
    loadMore,
    refresh,
    setQuery,
    currentQuery,
  } = usePaginatedResource<Notification>({
    initial: initialNotifications,
    endpoint: "/api/notifications",
    initialQuery: { limit: initialNotifications.pageInfo.limit || 10 },
  });

  const handleStreamEvent = useCallback(
    (event: NotificationStreamEvent) => {
      if (event === "init" || event === "ping" || event === "error") {
        return;
      }
      void refresh(currentQuery);
    },
    [currentQuery, refresh],
  );

  const { connectionState } = useNotificationStream({
    enabled: true,
    onEvent: handleStreamEvent,
  });

  const unreadCount = useMemo(
    () => items.filter((notification) => !notification.readAt).length,
    [items],
  );

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const openPanel = useCallback(async () => {
    setIsOpen(true);
    await refresh(currentQuery);
  }, [currentQuery, refresh]);

  const handleBellClick = useCallback(async () => {
    if (isOpen) {
      closePanel();
      return;
    }
    await openPanel();
  }, [closePanel, isOpen, openPanel]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePanel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closePanel, isOpen]);

  const handleMarkAsRead = useCallback(
    async (notificationId: string): Promise<ActionResult> => {
      setPendingNotificationId(notificationId);
      try {
        const result = await markNotificationReadAction(notificationId);
        if (result.error) {
          showToast(result.error, { type: "error" });
        } else if (result.success) {
          showToast(result.success, { type: "success" });
          await refresh(currentQuery);
        }
        return result;
      } finally {
        setPendingNotificationId((current) =>
          current === notificationId ? null : current,
        );
      }
    },
    [currentQuery, refresh, showToast],
  );

  const handleMarkAllAsRead = useCallback(() => {
    startMarkAll(async () => {
      const result = await markAllNotificationsReadAction();
      if (result.error) {
        showToast(result.error, { type: "error" });
        return;
      }
      showToast(result.success ?? "Todas las notificaciones leídas", {
        type: "success",
      });
      await refresh(currentQuery);
    });
  }, [currentQuery, refresh, showToast, startMarkAll]);

  const handleToggleFilter = useCallback(async () => {
    const next = !viewUnreadOnly;
    setViewUnreadOnly(next);
    await setQuery({
      ...currentQuery,
      unreadOnly: next ? true : undefined,
    });
  }, [currentQuery, setQuery, viewUnreadOnly]);

  const hasNotifications = items.length > 0;

  return (
    <>
      <div
        className="relative"
        data-testid="notification-center"
        data-stream-state={connectionState}
      >
        <button
          type="button"
          onClick={() => void handleBellClick()}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-brisa-500/30 bg-brisa-800 text-brisa-100 transition-colors hover:border-brisa-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-brisa-300"
          aria-label={
            isOpen
              ? "Cerrar panel de notificaciones"
              : "Abrir panel de notificaciones"
          }
          data-testid="notification-bell"
        >
          <span aria-hidden="true">🔔</span>
          {unreadCount > 0 && (
            <span
              data-testid="notification-badge"
              className="absolute -top-1 -right-1 min-w-[1.5rem] rounded-full bg-red-500 px-1 text-xs font-semibold text-white"
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {isOpen ? (
        <>
          <div
            data-testid="notification-backdrop"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={closePanel}
          />
          <aside
            data-testid="notification-panel"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-brisa-500/40 bg-brisa-950/95 text-brisa-100 shadow-2xl backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Panel de notificaciones"
          >
            <header className="flex items-start gap-3 border-b border-brisa-700/40 px-5 py-4">
              <div className="flex-1">
                <p className="m-0 text-xs uppercase tracking-[0.2em] text-brisa-500">
                  Actividad
                </p>
                <h3 className="mt-1 mb-0 text-lg font-semibold text-white">
                  Notificaciones
                </h3>
                <p className="m-0 text-xs text-brisa-300">
                  {unreadCount > 0 ? `${unreadCount} sin leer` : "Todas al día"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleToggleFilter()}
                    className="text-xs"
                    disabled={
                      isLoading ||
                      isLoadingMore ||
                      pendingNotificationId !== null
                    }
                  >
                    {viewUnreadOnly ? "Ver todas" : "Sólo sin leer"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={
                      isMarkingAll ||
                      unreadCount === 0 ||
                      isLoading ||
                      pendingNotificationId !== null
                    }
                    onClick={handleMarkAllAsRead}
                    className="text-xs"
                  >
                    {isMarkingAll ? "..." : "Marcar todas"}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={closePanel}
                  className="text-xs"
                  data-testid="notification-close"
                  aria-label="Cerrar panel de notificaciones"
                >
                  Cerrar
                </Button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : hasNotifications ? (
                <div className="space-y-3">
                  {items.map((notification) => (
                    <article
                      key={notification.id}
                      data-testid="notification-item"
                      className={`rounded-xl border px-4 py-3 text-sm transition-colors ${
                        notification.readAt
                          ? "border-brisa-600/20 bg-brisa-800/40 text-brisa-200"
                          : "border-brisa-400/40 bg-brisa-700/40 text-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="m-0 text-sm font-medium">
                            {notification.message}
                          </p>
                          <p className="m-0 text-xs text-brisa-300">
                            {formatter.format(new Date(notification.createdAt))}
                            {" · "}
                            {formatDistanceToNow(
                              new Date(notification.createdAt),
                              {
                                addSuffix: true,
                                locale: es,
                              },
                            )}
                          </p>
                        </div>
                        {!notification.readAt ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs text-brisa-200 hover:text-white"
                            onClick={() =>
                              void handleMarkAsRead(notification.id)
                            }
                            data-testid="notification-mark-read"
                            disabled={
                              pendingNotificationId === notification.id ||
                              isLoading ||
                              isLoadingMore
                            }
                            aria-busy={
                              pendingNotificationId === notification.id
                            }
                          >
                            Marcar
                          </Button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="m-0 py-6 text-center text-sm text-brisa-300">
                  {viewUnreadOnly
                    ? "¡Todo al día! No hay notificaciones pendientes."
                    : "Aún no hay notificaciones registradas."}
                </p>
              )}
            </div>

            {pageInfo.hasMore ? (
              <div className="border-t border-brisa-700/30 px-4 py-3">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => void loadMore()}
                  disabled={isLoadingMore}
                  data-testid="notification-load-more"
                >
                  {isLoadingMore ? "Cargando..." : "Cargar más"}
                </Button>
              </div>
            ) : null}
          </aside>
        </>
      ) : null}
    </>
  );
}
