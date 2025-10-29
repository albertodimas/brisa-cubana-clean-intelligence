import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brisa-500 focus-visible:ring-offset-2 focus-visible:ring-offset-brisa-900 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-br from-[#1e40af] via-[#2563eb] to-[#38bdf8] text-white shadow-lg shadow-[#1e40af33] hover:shadow-[#1e40af4d] hover:scale-[1.01] active:scale-[0.98]",
        secondary:
          "bg-white/10 text-white backdrop-blur border border-white/20 hover:bg-white/20 hover:text-white dark:bg-brisa-900/70 dark:border-brisa-700/60 dark:hover:bg-brisa-900/90",
        danger:
          "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm hover:shadow-md",
        success:
          "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm hover:shadow-md",
        outline:
          "border border-brisa-600/50 text-brisa-200 hover:bg-brisa-800/50 hover:text-brisa-50 hover:border-brisa-500 backdrop-blur-sm",
        ghost:
          "text-brisa-300 hover:bg-brisa-800/50 hover:text-brisa-50 active:bg-brisa-700/50",
        link: "text-brisa-400 hover:text-brisa-300 underline-offset-4 hover:underline",
      },
      size: {
        xs: "text-xs px-2 py-1 gap-1 rounded-md",
        sm: "text-sm px-3 py-1.5 gap-1.5",
        md: "text-base px-4 py-2 gap-2",
        lg: "text-lg px-6 py-3 gap-2.5",
        xl: "text-xl px-8 py-4 gap-3",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Muestra spinner de carga
   */
  isLoading?: boolean;
  /**
   * Icono a mostrar antes del contenido
   */
  icon?: React.ReactNode;
  /**
   * Icono a mostrar después del contenido
   */
  iconRight?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      icon,
      iconRight,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          icon && <span className="inline-flex items-center">{icon}</span>
        )}
        {children}
        {!isLoading && iconRight && (
          <span className="inline-flex items-center">{iconRight}</span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
