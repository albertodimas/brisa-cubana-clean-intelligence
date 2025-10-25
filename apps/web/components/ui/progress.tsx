"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Progreso actual (0-100)
   */
  value?: number;
  /**
   * Mostrar etiqueta de porcentaje
   */
  showLabel?: boolean;
  /**
   * Variante de color
   */
  variant?: "default" | "success" | "warning" | "error" | "info";
  /**
   * Tamaño de la barra
   */
  size?: "sm" | "md" | "lg";
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      showLabel = false,
      variant = "default",
      size = "md",
      ...props
    },
    ref,
  ) => {
    const clampedValue = Math.min(Math.max(value, 0), 100);

    const variantClasses = {
      default: "bg-brisa-600",
      success: "bg-emerald-600",
      warning: "bg-amber-600",
      error: "bg-red-600",
      info: "bg-blue-600",
    };

    const sizeClasses = {
      sm: "h-1",
      md: "h-2",
      lg: "h-3",
    };

    return (
      <div className="w-full space-y-1">
        <div
          ref={ref}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={clampedValue}
          className={cn(
            "relative w-full overflow-hidden rounded-full bg-brisa-800/50 backdrop-blur-sm",
            sizeClasses[size],
            className,
          )}
          {...props}
        >
          <div
            className={cn(
              "h-full transition-all duration-500 ease-smooth rounded-full",
              variantClasses[variant],
            )}
            style={{ width: `${clampedValue}%` }}
          />
        </div>
        {showLabel && (
          <div className="text-xs text-brisa-400 text-right">
            {clampedValue}%
          </div>
        )}
      </div>
    );
  },
);
Progress.displayName = "Progress";

export { Progress };
