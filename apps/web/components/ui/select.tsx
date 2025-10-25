"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  /**
   * Etiqueta del select
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
   * Opciones del select
   */
  options: SelectOption[];
  /**
   * Placeholder
   */
  placeholder?: string;
  /**
   * Tamaño del select
   */
  selectSize?: "sm" | "md" | "lg";
  /**
   * Clases adicionales para el wrapper
   */
  wrapperClassName?: string;
}

/**
 * Select component estilizado
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      options,
      placeholder,
      selectSize = "md",
      wrapperClassName,
      id,
      required,
      ...props
    },
    ref,
  ) => {
    const selectId = id || `select-${crypto.randomUUID()}`;
    const hasError = Boolean(error);

    const sizeClasses = {
      sm: "text-sm px-2.5 py-1.5",
      md: "text-base px-3 py-2",
      lg: "text-lg px-4 py-3",
    };

    return (
      <div className={cn("w-full", wrapperClassName)}>
        {label && (
          <label
            htmlFor={selectId}
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

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full appearance-none rounded-lg bg-brisa-800/80 border text-brisa-50",
              "transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent",
              "disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm",
              "pr-10", // Espacio para el icono
              hasError
                ? "border-red-500/50 focus:ring-red-500"
                : "border-brisa-600/50 hover:border-brisa-500/70 focus:ring-brisa-500",
              sizeClasses[selectSize],
              className,
            )}
            aria-invalid={hasError}
            aria-describedby={
              error
                ? `${selectId}-error`
                : helperText
                  ? `${selectId}-helper`
                  : undefined
            }
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Icono de chevron */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown className="w-5 h-5 text-brisa-400" />
          </div>
        </div>

        {error && (
          <p
            id={`${selectId}-error`}
            className="text-red-400 text-sm mt-1.5"
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p
            id={`${selectId}-helper`}
            className="text-brisa-400 text-sm mt-1.5"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
