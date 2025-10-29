import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1ecad3] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0d1a2d] disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-br from-[#0d2944] via-[#11466d] to-[#1ecad3] text-white shadow-lg shadow-[#0d294433] hover:shadow-[#0d29444d] hover:scale-[1.01] active:scale-[0.98]",
        secondary:
          "bg-white/10 text-white backdrop-blur border border-white/25 hover:bg-white/20 hover:text-white dark:bg-[#0d1a2d]/70 dark:border-[#153050]/60 dark:hover:bg-[#0d1a2d]/90",
        danger:
          "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm hover:shadow-md",
        success:
          "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm hover:shadow-md",
        outline:
          "border border-[#1ecad3]/50 text-[#0f8c94] hover:bg-[#0c6870]/10 hover:text-[#0d2944] hover:border-[#1ecad3] backdrop-blur-sm",
        ghost:
          "text-[#7adfe9] hover:bg-[#0c6870]/40 hover:text-white active:bg-[#0f8c94]/40",
        link: "text-[#1ecad3] hover:text-[#15aeb6] underline-offset-4 hover:underline",
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
