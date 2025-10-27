"use client";

import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /**
   * Etiqueta del checkbox
   */
  label?: React.ReactNode;
  /**
   * Descripción adicional
   */
  description?: string;
  /**
   * Estado indeterminado
   */
  indeterminate?: boolean;
  /**
   * Tamaño del checkbox
   */
  size?: "sm" | "md" | "lg";
  /**
   * Mensaje de error
   */
  error?: string;
}

/**
 * Checkbox component estilizado con soporte para estado indeterminado
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      label,
      description,
      indeterminate = false,
      size = "md",
      error,
      id,
      ...props
    },
    ref,
  ) => {
    const checkboxRef = React.useRef<HTMLInputElement>(null);
    const checkboxId = id || `checkbox-${crypto.randomUUID()}`;

    // Combinar refs
    React.useImperativeHandle(ref, () => checkboxRef.current!);

    // Establecer estado indeterminado
    React.useEffect(() => {
      if (checkboxRef.current) {
        checkboxRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    const sizeClasses = {
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6",
    };

    const iconSizeClasses = {
      sm: "w-3 h-3",
      md: "w-4 h-4",
      lg: "w-5 h-5",
    };

    return (
      <div className="flex items-start gap-3">
        <div className="relative flex items-center">
          <input
            ref={checkboxRef}
            type="checkbox"
            id={checkboxId}
            className={cn(
              "peer appearance-none rounded border-2 transition-all duration-200",
              "bg-brisa-800/80 border-brisa-600/50",
              "hover:border-brisa-500/70 focus:outline-none focus:ring-2 focus:ring-brisa-500 focus:ring-offset-2 focus:ring-offset-brisa-900",
              "checked:bg-brisa-600 checked:border-brisa-600",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "cursor-pointer",
              sizeClasses[size],
              error && "border-red-500/50 focus:ring-red-500",
              className,
            )}
            aria-describedby={error ? `${checkboxId}-error` : undefined}
            {...props}
          />

          {/* Icono de check/minus */}
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center pointer-events-none",
              "text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200",
            )}
          >
            {indeterminate ? (
              <Minus className={iconSizeClasses[size]} />
            ) : (
              <Check className={iconSizeClasses[size]} />
            )}
          </div>
        </div>

        {(label || description) && (
          <div className="flex-1 pt-0.5">
            {label && (
              <label
                htmlFor={checkboxId}
                className="text-sm font-medium text-brisa-200 cursor-pointer block"
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-brisa-400 mt-1">{description}</p>
            )}
          </div>
        )}

        {error && (
          <p
            id={`${checkboxId}-error`}
            className="text-red-400 text-sm"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";

export interface CheckboxGroupProps {
  /**
   * Etiqueta del grupo
   */
  label?: string;
  /**
   * Descripción del grupo
   */
  description?: string;
  /**
   * Opciones del checkbox group
   */
  children: React.ReactNode;
  /**
   * Mensaje de error
   */
  error?: string;
  /**
   * Clases adicionales
   */
  className?: string;
}

/**
 * Wrapper para múltiples checkboxes
 */
export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  label,
  description,
  children,
  error,
  className,
}) => {
  return (
    <fieldset className={cn("space-y-3", className)}>
      {(label || description) && (
        <legend className="mb-3">
          {label && (
            <span className="text-sm font-medium text-brisa-200 block mb-1">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-brisa-400">{description}</span>
          )}
        </legend>
      )}

      <div className="space-y-2">{children}</div>

      {error && (
        <p className="text-red-400 text-sm mt-2" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
};
