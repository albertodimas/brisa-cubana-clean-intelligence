import * as React from "react";
import {
  FileQuestion,
  SearchX,
  Inbox,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  /**
   * Icono a mostrar
   */
  icon?: LucideIcon;
  /**
   * Título del estado vacío
   */
  title: string;
  /**
   * Descripción del estado vacío
   */
  description?: string;
  /**
   * Acción primaria (botón)
   */
  action?: React.ReactNode;
  /**
   * Acción secundaria (link o botón)
   */
  secondaryAction?: React.ReactNode;
  /**
   * Variante de estilo
   */
  variant?: "default" | "search" | "error" | "inbox";
  /**
   * Clases adicionales
   */
  className?: string;
}

const variantIcons: Record<
  NonNullable<EmptyStateProps["variant"]>,
  LucideIcon
> = {
  default: FileQuestion,
  search: SearchX,
  error: AlertCircle,
  inbox: Inbox,
};

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  variant = "default",
  className,
}) => {
  const IconComponent = icon || variantIcons[variant];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className,
      )}
    >
      <div className="rounded-full bg-brisa-800/30 p-6 mb-6 backdrop-blur-sm border border-brisa-700/20">
        <IconComponent className="h-12 w-12 text-brisa-400" strokeWidth={1.5} />
      </div>

      <h3 className="text-lg font-semibold text-brisa-100 mb-2">{title}</h3>

      {description && (
        <p className="text-sm text-brisa-400 max-w-md mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {action && <div>{action}</div>}
          {secondaryAction && <div>{secondaryAction}</div>}
        </div>
      )}
    </div>
  );
};
EmptyState.displayName = "EmptyState";

export { EmptyState };
