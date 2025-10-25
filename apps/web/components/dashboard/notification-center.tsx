"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Check,
  CheckCheck,
  X,
  Trash2,
  Filter,
  Info,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/ui/empty-state";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
  /**
   * ID único de la notificación
   */
  id: string;
  /**
   * Tipo de notificación
   */
  type: NotificationType;
  /**
   * Título de la notificación
   */
  title: string;
  /**
   * Mensaje de la notificación
   */
  message?: string;
  /**
   * Timestamp de la notificación
   */
  timestamp: Date;
  /**
   * Si la notificación ha sido leída
   */
  read: boolean;
  /**
   * Acción personalizada
   */
  action?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Link relacionado
   */
  href?: string;
}

export interface NotificationCenterProps {
  /**
   * Lista de notificaciones
   */
  notifications: Notification[];
  /**
   * Callback al marcar como leída
   */
  onMarkAsRead?: (id: string) => void;
  /**
   * Callback al marcar todas como leídas
   */
  onMarkAllAsRead?: () => void;
  /**
   * Callback al eliminar notificación
   */
  onDelete?: (id: string) => void;
  /**
   * Callback al limpiar todas
   */
  onClearAll?: () => void;
  /**
   * Máximo de notificaciones a mostrar
   */
  maxVisible?: number;
  /**
   * Mostrar badge con el conteo
   */
  showBadge?: boolean;
}

const notificationIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

const notificationColors = {
  info: "text-blue-400",
  success: "text-emerald-400",
  warning: "text-amber-400",
  error: "text-red-400",
};

/**
 * Centro de notificaciones con dropdown
 */
export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  maxVisible = 5,
  showBadge = true,
}: NotificationCenterProps) {
  const [filter, setFilter] = React.useState<NotificationType | "all">("all");
  const [isOpen, setIsOpen] = React.useState(false);

  const filteredNotifications = React.useMemo(() => {
    if (filter === "all") return notifications;
    return notifications.filter((n) => n.type === filter);
  }, [notifications, filter]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Hace unos segundos";
    if (diffInSeconds < 3600)
      return `Hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400)
      return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800)
      return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
    return date.toLocaleDateString();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {showBadge && unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[400px] p-0">
        {/* Header */}
        <div className="p-4 border-b border-brisa-700/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-brisa-50">
              Notificaciones
            </h3>
            {unreadCount > 0 && (
              <Badge variant="default" size="sm">
                {unreadCount} nuevas
              </Badge>
            )}
          </div>

          {/* Filter buttons */}
          <div className="flex gap-2">
            <Button
              size="xs"
              variant={filter === "all" ? "primary" : "ghost"}
              onClick={() => setFilter("all")}
            >
              Todas
            </Button>
            <Button
              size="xs"
              variant={filter === "info" ? "primary" : "ghost"}
              onClick={() => setFilter("info")}
            >
              Info
            </Button>
            <Button
              size="xs"
              variant={filter === "success" ? "primary" : "ghost"}
              onClick={() => setFilter("success")}
            >
              Éxito
            </Button>
            <Button
              size="xs"
              variant={filter === "warning" ? "primary" : "ghost"}
              onClick={() => setFilter("warning")}
            >
              Avisos
            </Button>
            <Button
              size="xs"
              variant={filter === "error" ? "primary" : "ghost"}
              onClick={() => setFilter("error")}
            >
              Errores
            </Button>
          </div>
        </div>

        {/* Notifications list */}
        <div className="max-h-[400px] overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="p-8">
              <EmptyState
                variant="inbox"
                title="No hay notificaciones"
                description={
                  filter === "all"
                    ? "Estás al día con todas tus notificaciones"
                    : `No hay notificaciones de tipo ${filter}`
                }
              />
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredNotifications
                .slice(0, maxVisible)
                .map((notification) => {
                  const Icon = notificationIcons[notification.type];

                  return (
                    <motion.div
                      key={notification.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={cn(
                        "p-4 border-b border-brisa-700/30 hover:bg-brisa-900/30 transition-colors group",
                        !notification.read && "bg-brisa-900/20",
                      )}
                    >
                      <div className="flex gap-3">
                        <div
                          className={cn(
                            "flex-shrink-0 mt-0.5",
                            notificationColors[notification.type],
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4
                              className={cn(
                                "text-sm font-semibold",
                                notification.read
                                  ? "text-brisa-300"
                                  : "text-brisa-50",
                              )}
                            >
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-brisa-500 rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>

                          {notification.message && (
                            <p className="text-sm text-brisa-400 mb-2 line-clamp-2">
                              {notification.message}
                            </p>
                          )}

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-brisa-500">
                              {getRelativeTime(notification.timestamp)}
                            </span>

                            {/* Action buttons */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notification.read && onMarkAsRead && (
                                <button
                                  onClick={() => onMarkAsRead(notification.id)}
                                  className="p-1 hover:bg-brisa-800 rounded transition-colors"
                                  title="Marcar como leída"
                                >
                                  <Check className="w-3 h-3 text-brisa-400" />
                                </button>
                              )}
                              {onDelete && (
                                <button
                                  onClick={() => onDelete(notification.id)}
                                  className="p-1 hover:bg-red-900/30 rounded transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3 h-3 text-red-400" />
                                </button>
                              )}
                            </div>
                          </div>

                          {notification.action && (
                            <button
                              onClick={notification.action.onClick}
                              className="mt-2 text-xs text-brisa-400 hover:text-brisa-300 font-semibold underline"
                            >
                              {notification.action.label}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        {filteredNotifications.length > 0 && (
          <div className="p-3 border-t border-brisa-700/30 flex gap-2">
            {unreadCount > 0 && onMarkAllAsRead && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onMarkAllAsRead}
                icon={<CheckCheck className="w-4 h-4" />}
                className="flex-1"
              >
                Marcar todas como leídas
              </Button>
            )}
            {onClearAll && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onClearAll}
                icon={<Trash2 className="w-4 h-4" />}
                className="flex-1"
              >
                Limpiar todo
              </Button>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
