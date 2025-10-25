import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const inputVariants = cva(
  "w-full px-3 py-2 bg-brisa-800/80 border rounded-lg text-brisa-50 placeholder-brisa-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm",
  {
    variants: {
      variant: {
        default:
          "border-brisa-600/50 hover:border-brisa-500/70 focus:ring-brisa-500",
        error: "border-red-500/50 focus:ring-red-500 hover:border-red-500/70",
        success:
          "border-emerald-500/50 focus:ring-emerald-500 hover:border-emerald-500/70",
      },
      inputSize: {
        sm: "text-sm px-2.5 py-1.5",
        md: "text-base px-3 py-2",
        lg: "text-lg px-4 py-3",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "md",
    },
  },
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  /**
   * Etiqueta del input
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
   * Icono al inicio del input
   */
  prefixIcon?: React.ReactNode;
  /**
   * Icono al final del input
   */
  suffixIcon?: React.ReactNode;
  /**
   * Contenedor del input wrapeado
   */
  wrapperClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      inputSize,
      label,
      error,
      helperText,
      prefixIcon,
      suffixIcon,
      wrapperClassName,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || `input-${crypto.randomUUID()}`;
    const hasError = Boolean(error);
    const finalVariant = hasError ? "error" : variant;

    return (
      <div className={cn("w-full", wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-brisa-200 mb-1.5"
          >
            {label}
            {props.required && (
              <span className="text-red-400 ml-1" aria-label="requerido">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {prefixIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brisa-400 pointer-events-none">
              {prefixIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              inputVariants({ variant: finalVariant, inputSize }),
              prefixIcon && "pl-10",
              suffixIcon && "pr-10",
              className,
            )}
            aria-invalid={hasError}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            {...props}
          />

          {suffixIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brisa-400 pointer-events-none">
              {suffixIcon}
            </div>
          )}
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            className="text-red-400 text-sm mt-1.5"
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-brisa-400 text-sm mt-1.5">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input, inputVariants };
