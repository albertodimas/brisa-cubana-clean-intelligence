import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default:
          "bg-brisa-900/50 text-brisa-100 border-brisa-700/30 backdrop-blur-sm [&>svg]:text-brisa-400",
        success:
          "bg-emerald-950/50 text-emerald-100 border-emerald-800/50 backdrop-blur-sm [&>svg]:text-emerald-400",
        warning:
          "bg-amber-950/50 text-amber-100 border-amber-800/50 backdrop-blur-sm [&>svg]:text-amber-400",
        error:
          "bg-red-950/50 text-red-100 border-red-800/50 backdrop-blur-sm [&>svg]:text-red-400",
        info: "bg-blue-950/50 text-blue-100 border-blue-800/50 backdrop-blur-sm [&>svg]:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const variantIcons: Record<
  NonNullable<VariantProps<typeof alertVariants>["variant"]>,
  LucideIcon
> = {
  default: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /**
   * Icono personalizado (opcional, usa icono por defecto según variant)
   */
  icon?: React.ReactNode;
  /**
   * Muestra botón de cerrar
   */
  dismissible?: boolean;
  /**
   * Callback al cerrar
   */
  onDismiss?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = "default",
      icon,
      dismissible,
      onDismiss,
      children,
      ...props
    },
    ref,
  ) => {
    const [isVisible, setIsVisible] = React.useState(true);

    const handleDismiss = () => {
      setIsVisible(false);
      onDismiss?.();
    };

    if (!isVisible) return null;

    const IconComponent = variantIcons[variant || "default"];
    const showIcon = icon !== null;

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {showIcon && (icon || <IconComponent className="h-4 w-4" />)}
        <div className="flex-1">{children}</div>
        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute right-3 top-3 rounded-md p-1 hover:bg-black/10 transition-colors focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2 focus:ring-offset-transparent"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  },
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm opacity-90 [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
