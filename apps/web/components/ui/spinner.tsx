import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const spinnerVariants = cva(
  "animate-spin rounded-full border-2 border-current",
  {
    variants: {
      variant: {
        default: "border-brisa-600 border-t-transparent",
        primary: "border-brisa-500 border-t-transparent",
        secondary: "border-brisa-300 border-t-transparent",
        success: "border-emerald-600 border-t-transparent",
        warning: "border-amber-600 border-t-transparent",
        error: "border-red-600 border-t-transparent",
        info: "border-blue-600 border-t-transparent",
      },
      size: {
        xs: "h-3 w-3 border",
        sm: "h-4 w-4 border",
        md: "h-6 w-6 border-2",
        lg: "h-8 w-8 border-2",
        xl: "h-12 w-12 border-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  /**
   * Texto descriptivo para accesibilidad
   */
  label?: string;
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, variant, size, label = "Cargando...", ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        className={cn(spinnerVariants({ variant, size }), className)}
        {...props}
      >
        <span className="sr-only">{label}</span>
      </div>
    );
  },
);
Spinner.displayName = "Spinner";

export interface LoadingOverlayProps {
  /**
   * Mensaje a mostrar
   */
  message?: string;
  /**
   * Variante del spinner
   */
  variant?: VariantProps<typeof spinnerVariants>["variant"];
  /**
   * Tamaño del spinner
   */
  size?: VariantProps<typeof spinnerVariants>["size"];
}

/**
 * Overlay de carga centrado con blur de fondo
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = "Cargando...",
  variant = "default",
  size = "lg",
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-4 rounded-lg bg-brisa-900/95 p-8 shadow-2xl border border-brisa-700/30">
        <Spinner variant={variant} size={size} label={message} />
        {message && (
          <p className="text-sm text-brisa-200 font-medium">{message}</p>
        )}
      </div>
    </div>
  );
};
LoadingOverlay.displayName = "LoadingOverlay";

export { Spinner, LoadingOverlay, spinnerVariants };
