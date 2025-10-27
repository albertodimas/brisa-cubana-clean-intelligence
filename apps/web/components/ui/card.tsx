import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const cardVariants = cva("rounded-xl border transition-all duration-200", {
  variants: {
    variant: {
      default: "bg-brisa-800/60 border-brisa-600/20 backdrop-blur-sm",
      elevated:
        "bg-brisa-800/80 border-brisa-600/30 shadow-lg hover:shadow-xl hover:border-brisa-500/40",
      glass:
        "bg-brisa-900/30 border-brisa-700/20 backdrop-blur-md hover:bg-brisa-900/40",
      outline:
        "bg-transparent border-brisa-600/40 hover:border-brisa-500/60 hover:bg-brisa-900/20",
    },
    padding: {
      none: "p-0",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    },
  },
  defaultVariants: {
    variant: "default",
    padding: "md",
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /**
   * Muestra efecto hover interactivo
   */
  hoverable?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, hoverable, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant, padding }),
        hoverable && "hover:scale-[1.02] cursor-pointer",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 mb-4", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold text-brisa-50 leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-brisa-300 leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center mt-6 pt-4 border-t border-brisa-700/30",
      className,
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
};
