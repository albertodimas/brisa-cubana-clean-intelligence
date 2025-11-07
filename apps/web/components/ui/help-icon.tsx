"use client";

import { HelpCircle } from "lucide-react";
import { Tooltip } from "./tooltip";
import { cn } from "@/lib/cn";

export interface HelpIconProps {
  /**
   * Contenido de la ayuda
   */
  content: React.ReactNode;
  /**
   * Posición del tooltip
   */
  position?: "top" | "bottom" | "left" | "right";
  /**
   * Tamaño del icono
   */
  size?: "sm" | "md" | "lg";
  /**
   * Clases adicionales
   */
  className?: string;
}

const sizeClasses = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

/**
 * Icono de ayuda con tooltip contextual
 */
export function HelpIcon({
  content,
  position = "top",
  size = "sm",
  className,
}: HelpIconProps) {
  return (
    <Tooltip content={content} position={position} delay={200}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center justify-center rounded-full",
          "text-brisa-400 hover:text-brisa-300 dark:text-brisa-500 dark:hover:text-brisa-400",
          "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brisa-400",
          "cursor-help",
          className,
        )}
        aria-label="Ayuda"
      >
        <HelpCircle className={cn(sizeClasses[size])} />
      </button>
    </Tooltip>
  );
}

export interface HelpTextProps {
  /**
   * Texto de ayuda a mostrar
   */
  children: React.ReactNode;
  /**
   * Clases adicionales
   */
  className?: string;
}

/**
 * Texto de ayuda sin icono
 */
export function HelpText({ children, className }: HelpTextProps) {
  return (
    <p
      className={cn(
        "text-xs text-gray-500 dark:text-brisa-400 leading-relaxed",
        className,
      )}
    >
      {children}
    </p>
  );
}

export interface InfoBannerProps {
  /**
   * Contenido del banner
   */
  children: React.ReactNode;
  /**
   * Tipo de información
   */
  variant?: "info" | "tip" | "warning";
  /**
   * Clases adicionales
   */
  className?: string;
}

const variantStyles = {
  info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800/30 dark:text-blue-200",
  tip: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800/30 dark:text-emerald-200",
  warning:
    "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800/30 dark:text-amber-200",
};

/**
 * Banner informativo para ayuda contextual
 */
export function InfoBanner({
  children,
  variant = "info",
  className,
}: InfoBannerProps) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm animate-slide-down",
        variantStyles[variant],
        className,
      )}
      role="status"
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {variant === "info" && (
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          {variant === "tip" && (
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          )}
          {variant === "warning" && (
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          )}
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
