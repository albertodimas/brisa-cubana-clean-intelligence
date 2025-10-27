import * as React from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Etiqueta del textarea
   */
  label?: string;
  /**
   * Mensaje de error
   */
  error?: string;
  /**
   * Texto de ayuda
   */
  helperText?: string;
  /**
   * Mostrar contador de caracteres
   */
  showCharCount?: boolean;
  /**
   * Clases adicionales para el wrapper
   */
  wrapperClassName?: string;
}

/**
 * Textarea component estilizado con contador de caracteres opcional
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      showCharCount = false,
      wrapperClassName,
      id,
      required,
      maxLength,
      value,
      ...props
    },
    ref,
  ) => {
    const textareaId = id || `textarea-${crypto.randomUUID()}`;
    const hasError = Boolean(error);
    const currentLength = typeof value === "string" ? value.length : 0;

    return (
      <div className={cn("w-full", wrapperClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-brisa-200 mb-1.5"
          >
            {label}
            {required && (
              <span className="text-red-400 ml-1" aria-label="requerido">
                *
              </span>
            )}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full px-3 py-2 bg-brisa-800/80 border rounded-lg text-brisa-50",
            "placeholder-brisa-400 transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm",
            "resize-y min-h-[100px]",
            hasError
              ? "border-red-500/50 focus:ring-red-500"
              : "border-brisa-600/50 hover:border-brisa-500/70 focus:ring-brisa-500",
            className,
          )}
          aria-invalid={hasError}
          aria-describedby={
            error
              ? `${textareaId}-error`
              : helperText
                ? `${textareaId}-helper`
                : undefined
          }
          maxLength={maxLength}
          value={value}
          {...props}
        />

        {/* Footer con error/helper y contador */}
        <div className="flex items-start justify-between gap-2 mt-1.5">
          <div className="flex-1">
            {error && (
              <p
                id={`${textareaId}-error`}
                className="text-red-400 text-sm"
                role="alert"
              >
                {error}
              </p>
            )}

            {helperText && !error && (
              <p id={`${textareaId}-helper`} className="text-brisa-400 text-sm">
                {helperText}
              </p>
            )}
          </div>

          {showCharCount && maxLength && (
            <span
              className={cn(
                "text-xs font-medium whitespace-nowrap",
                currentLength > maxLength * 0.9
                  ? "text-amber-400"
                  : "text-brisa-500",
              )}
            >
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
