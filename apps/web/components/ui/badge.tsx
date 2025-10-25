import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brisa-500 focus:ring-offset-2 focus:ring-offset-brisa-900",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brisa-600 text-white hover:bg-brisa-700 shadow-sm",
        secondary:
          "border-transparent bg-brisa-800/50 text-brisa-200 hover:bg-brisa-800/70 backdrop-blur-sm",
        success:
          "border-transparent bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
        warning:
          "border-transparent bg-amber-600 text-white hover:bg-amber-700 shadow-sm",
        error:
          "border-transparent bg-red-600 text-white hover:bg-red-700 shadow-sm",
        info: "border-transparent bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
        outline:
          "border-brisa-700/50 text-brisa-300 hover:bg-brisa-800/30 backdrop-blur-sm",
        ghost: "border-transparent text-brisa-300 hover:bg-brisa-800/30",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Icono a mostrar antes del contenido
   */
  icon?: React.ReactNode;
  /**
   * Permite cerrar el badge (muestra X)
   */
  onClose?: () => void;
}

function Badge({
  className,
  variant,
  size,
  icon,
  onClose,
  children,
  ...props
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {icon && <span className="mr-1 inline-flex items-center">{icon}</span>}
      {children}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-1 inline-flex items-center rounded-full hover:bg-black/10 p-0.5 transition-colors focus:outline-none focus:ring-1 focus:ring-white"
          aria-label="Cerrar"
        >
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export { Badge, badgeVariants };
