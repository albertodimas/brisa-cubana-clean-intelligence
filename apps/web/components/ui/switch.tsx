"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /**
   * Etiqueta del switch
   */
  label?: React.ReactNode;
  /**
   * Descripción adicional
   */
  description?: string;
  /**
   * Tamaño del switch
   */
  size?: "sm" | "md" | "lg";
  /**
   * Estado controlado
   */
  checked?: boolean;
  /**
   * Callback cuando cambia el estado
   */
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * Switch/Toggle component animado
 */
export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      className,
      label,
      description,
      size = "md",
      checked,
      onCheckedChange,
      onChange,
      id,
      ...props
    },
    ref,
  ) => {
    const switchId = id || `switch-${crypto.randomUUID()}`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    const containerSizes = {
      sm: "w-9 h-5",
      md: "w-11 h-6",
      lg: "w-14 h-7",
    };

    const thumbSizes = {
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6",
    };

    const translateX = {
      sm: 16,
      md: 20,
      lg: 28,
    };

    return (
      <div className="flex items-start gap-3">
        <label
          htmlFor={switchId}
          className={cn(
            "relative inline-flex cursor-pointer items-center",
            props.disabled && "cursor-not-allowed opacity-50",
          )}
        >
          {/* Input oculto */}
          <input
            ref={ref}
            type="checkbox"
            id={switchId}
            className="sr-only peer"
            checked={checked}
            onChange={handleChange}
            {...props}
          />

          {/* Track del switch */}
          <div
            className={cn(
              "relative rounded-full transition-colors duration-200",
              "bg-brisa-800/80 border-2 border-brisa-700/50",
              "peer-checked:bg-brisa-600 peer-checked:border-brisa-600",
              "peer-focus:ring-2 peer-focus:ring-brisa-500 peer-focus:ring-offset-2 peer-focus:ring-offset-brisa-900",
              containerSizes[size],
              className,
            )}
          >
            {/* Thumb animado */}
            <motion.div
              className={cn(
                "absolute top-0.5 left-0.5 rounded-full bg-white shadow-sm",
                thumbSizes[size],
              )}
              animate={{
                x: checked ? translateX[size] : 0,
              }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
              }}
            />
          </div>
        </label>

        {(label || description) && (
          <div className="flex-1 pt-0.5">
            {label && (
              <label
                htmlFor={switchId}
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

Switch.displayName = "Switch";
