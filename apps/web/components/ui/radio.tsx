"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /**
   * Etiqueta del radio
   */
  label?: React.ReactNode;
  /**
   * Descripción adicional
   */
  description?: string;
  /**
   * Tamaño del radio
   */
  size?: "sm" | "md" | "lg";
}

/**
 * Radio button component estilizado
 */
export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, size = "md", id, ...props }, ref) => {
    const radioId = id || `radio-${crypto.randomUUID()}`;

    const sizeClasses = {
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6",
    };

    return (
      <div className="flex items-start gap-3">
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            className={cn(
              "peer appearance-none rounded-full border-2 transition-all duration-200",
              "bg-brisa-800/80 border-brisa-600/50",
              "hover:border-brisa-500/70 focus:outline-none focus:ring-2 focus:ring-brisa-500 focus:ring-offset-2 focus:ring-offset-brisa-900",
              "checked:border-brisa-600",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "cursor-pointer",
              sizeClasses[size],
              className,
            )}
            {...props}
          />

          {/* Círculo interior cuando está seleccionado */}
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center pointer-events-none",
            )}
          >
            <div
              className={cn(
                "rounded-full bg-brisa-500 transition-transform duration-200",
                "scale-0 peer-checked:scale-100",
                size === "sm" && "w-2 h-2",
                size === "md" && "w-2.5 h-2.5",
                size === "lg" && "w-3 h-3",
              )}
            />
          </div>
        </div>

        {(label || description) && (
          <div className="flex-1 pt-0.5">
            {label && (
              <label
                htmlFor={radioId}
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
      </div>
    );
  },
);

Radio.displayName = "Radio";

export interface RadioGroupProps {
  /**
   * Etiqueta del grupo
   */
  label?: string;
  /**
   * Descripción del grupo
   */
  description?: string;
  /**
   * Nombre del grupo (requerido para agrupar radios)
   */
  name: string;
  /**
   * Valor seleccionado
   */
  value?: string;
  /**
   * Callback cuando cambia la selección
   */
  onChange?: (value: string) => void;
  /**
   * Opciones del radio group
   */
  children: React.ReactNode;
  /**
   * Mensaje de error
   */
  error?: string;
  /**
   * Orientación del grupo
   */
  orientation?: "vertical" | "horizontal";
  /**
   * Clases adicionales
   */
  className?: string;
}

/**
 * Wrapper para múltiples radio buttons
 */
export const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  description,
  name,
  value,
  onChange,
  children,
  error,
  orientation = "vertical",
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

      <div
        className={cn(
          orientation === "vertical" ? "space-y-2" : "flex flex-wrap gap-4",
        )}
        role="radiogroup"
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement<RadioProps>(child)) {
            const childValue = child.props.value;
            const childOnChange = child.props.onChange;

            return React.cloneElement<RadioProps>(child, {
              ...child.props,
              name,
              checked: childValue === value,
              onChange: onChange
                ? (e: React.ChangeEvent<HTMLInputElement>) => {
                    onChange(e.target.value);
                  }
                : childOnChange,
            });
          }
          return child;
        })}
      </div>

      {error && (
        <p className="text-red-400 text-sm mt-2" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
};
