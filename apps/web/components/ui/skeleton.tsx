import * as React from "react";
import { cn } from "@/lib/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Variante del skeleton
   */
  variant?: "text" | "circular" | "rectangular" | "rounded";
  /**
   * Ancho del skeleton
   */
  width?: string | number;
  /**
   * Alto del skeleton
   */
  height?: string | number;
  /**
   * Número de líneas (para text variant)
   */
  lines?: number;
  /**
   * Animación
   */
  animation?: "pulse" | "wave" | "none";
}

/**
 * Skeleton loader para estados de carga
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className,
      variant = "rectangular",
      width,
      height,
      lines = 1,
      animation = "pulse",
      ...props
    },
    ref,
  ) => {
    const variantClasses = {
      text: "h-4 rounded",
      circular: "rounded-full",
      rectangular: "",
      rounded: "rounded-lg",
    };

    const animationClasses = {
      pulse: "animate-pulse",
      wave: "animate-shimmer bg-gradient-to-r from-brisa-800/50 via-brisa-700/50 to-brisa-800/50 bg-[length:200%_100%]",
      none: "",
    };

    const style: React.CSSProperties = {
      width: typeof width === "number" ? `${width}px` : width,
      height: typeof height === "number" ? `${height}px` : height,
    };

    if (variant === "text" && lines > 1) {
      return (
        <div ref={ref} className={cn("space-y-2", className)} {...props}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-4 rounded bg-brisa-800/50",
                animationClasses[animation],
                i === lines - 1 && "w-4/5", // Last line is shorter
              )}
              style={i === 0 ? style : undefined}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "bg-brisa-800/50",
          variantClasses[variant],
          animationClasses[animation],
          className,
        )}
        style={style}
        {...props}
      />
    );
  },
);

Skeleton.displayName = "Skeleton";

export interface SkeletonCardProps {
  /**
   * Mostrar avatar
   */
  showAvatar?: boolean;
  /**
   * Número de líneas de texto
   */
  lines?: number;
  /**
   * Clases adicionales
   */
  className?: string;
}

/**
 * Skeleton de una card típica
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showAvatar = false,
  lines = 3,
  className,
}) => {
  return (
    <div
      className={cn(
        "p-6 rounded-xl border border-brisa-700/30 bg-brisa-900/50 space-y-4",
        className,
      )}
    >
      {showAvatar && (
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton width="40%" height={16} />
            <Skeleton width="60%" height={12} />
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Skeleton variant="rounded" height={200} />
        <Skeleton variant="text" lines={lines} />
      </div>

      <div className="flex gap-2">
        <Skeleton variant="rounded" width={100} height={36} />
        <Skeleton variant="rounded" width={100} height={36} />
      </div>
    </div>
  );
};

export interface SkeletonTableProps {
  /**
   * Número de filas
   */
  rows?: number;
  /**
   * Número de columnas
   */
  columns?: number;
  /**
   * Clases adicionales
   */
  className?: string;
}

/**
 * Skeleton de una tabla
 */
export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  className,
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-brisa-700/30">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} width="100%" height={20} className="flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex gap-4 py-3 border-b border-brisa-700/30"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              width="100%"
              height={16}
              className="flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export interface SkeletonListProps {
  /**
   * Número de items
   */
  items?: number;
  /**
   * Mostrar avatar en cada item
   */
  showAvatar?: boolean;
  /**
   * Clases adicionales
   */
  className?: string;
}

/**
 * Skeleton de una lista
 */
export const SkeletonList: React.FC<SkeletonListProps> = ({
  items = 5,
  showAvatar = true,
  className,
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {showAvatar && <Skeleton variant="circular" width={40} height={40} />}
          <div className="flex-1 space-y-2">
            <Skeleton width="70%" height={16} />
            <Skeleton width="50%" height={12} />
          </div>
        </div>
      ))}
    </div>
  );
};

export interface SkeletonScreenProps {
  /**
   * Tipo de pantalla
   */
  type?: "dashboard" | "list" | "detail" | "form";
  /**
   * Clases adicionales
   */
  className?: string;
}

/**
 * Skeleton de pantalla completa
 */
export const SkeletonScreen: React.FC<SkeletonScreenProps> = ({
  type = "dashboard",
  className,
}) => {
  if (type === "dashboard") {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Header */}
        <div className="space-y-2">
          <Skeleton width="30%" height={32} />
          <Skeleton width="50%" height={16} />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-lg border border-brisa-700/30 bg-brisa-900/50"
            >
              <Skeleton width="60%" height={14} className="mb-2" />
              <Skeleton width="40%" height={32} className="mb-2" />
              <Skeleton width="80%" height={12} />
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton variant="rounded" height={300} />
          <Skeleton variant="rounded" height={300} />
        </div>
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton width="30%" height={32} />
        <SkeletonList items={8} />
      </div>
    );
  }

  if (type === "detail") {
    return (
      <div className={cn("space-y-6", className)}>
        <Skeleton width="40%" height={32} />
        <Skeleton variant="rounded" height={400} />
        <Skeleton variant="text" lines={5} />
      </div>
    );
  }

  // form
  return (
    <div className={cn("space-y-6 max-w-2xl", className)}>
      <Skeleton width="40%" height={32} />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton width="30%" height={14} />
          <Skeleton variant="rounded" height={40} />
        </div>
      ))}
      <div className="flex gap-3">
        <Skeleton variant="rounded" width={120} height={40} />
        <Skeleton variant="rounded" width={120} height={40} />
      </div>
    </div>
  );
};
