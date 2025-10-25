"use client";

import * as React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./card";

const kpiCardVariants = cva("", {
  variants: {
    size: {
      sm: "text-2xl",
      md: "text-3xl",
      lg: "text-4xl",
    },
    trend: {
      up: "text-emerald-400",
      down: "text-red-400",
      neutral: "text-brisa-300",
      none: "",
    },
  },
  defaultVariants: {
    size: "md",
    trend: "none",
  },
});

export interface KPICardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof kpiCardVariants> {
  /**
   * Título del KPI (ej. "Total Reservas")
   */
  title: string;
  /**
   * Valor principal del KPI
   */
  value: string | number;
  /**
   * Descripción o subtítulo (ej. "120 completadas")
   */
  description?: string;
  /**
   * Icono a mostrar en el header
   */
  icon?: React.ReactNode;
  /**
   * Porcentaje de cambio (ej. "+12.5%")
   */
  trendPercentage?: string;
  /**
   * Variante de la card
   */
  cardVariant?: "default" | "elevated" | "glass" | "outline";
  /**
   * Formato de número personalizado
   */
  formatter?: (value: number) => string;
  /**
   * Si true, muestra animación hover
   */
  hoverable?: boolean;
}

export const KPICard = React.forwardRef<HTMLDivElement, KPICardProps>(
  (
    {
      className,
      title,
      value,
      description,
      icon,
      size = "md",
      trend = "none",
      trendPercentage,
      cardVariant = "default",
      formatter,
      hoverable = false,
      ...props
    },
    ref,
  ) => {
    const formattedValue = React.useMemo(() => {
      if (typeof value === "string") return value;
      if (formatter) return formatter(value);
      return value.toLocaleString();
    }, [value, formatter]);

    const getTrendIcon = () => {
      if (trend === "up") return TrendingUp;
      if (trend === "down") return TrendingDown;
      if (trend === "neutral") return Minus;
      return null;
    };

    const TrendIcon = getTrendIcon();

    return (
      <Card
        ref={ref}
        variant={cardVariant}
        hoverable={hoverable}
        className={cn("relative overflow-hidden", className)}
        {...props}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-sm font-medium text-brisa-400">
              {title}
            </CardTitle>
            {icon && <div className="text-brisa-500 opacity-80">{icon}</div>}
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-2">
            <div
              className={cn(
                "font-bold text-brisa-50",
                kpiCardVariants({ size }),
              )}
            >
              {formattedValue}
            </div>

            {(description || trendPercentage) && (
              <div className="flex items-center gap-2 text-sm">
                {trendPercentage && TrendIcon && (
                  <div
                    className={cn(
                      "flex items-center gap-1",
                      kpiCardVariants({ trend }),
                    )}
                  >
                    <TrendIcon className="w-4 h-4" />
                    <span className="font-medium">{trendPercentage}</span>
                  </div>
                )}
                {description && (
                  <CardDescription className="text-xs">
                    {description}
                  </CardDescription>
                )}
              </div>
            )}
          </div>
        </CardContent>

        {/* Decorative gradient overlay for elevated variant */}
        {cardVariant === "elevated" && (
          <div className="absolute inset-0 bg-gradient-to-br from-brisa-600/10 via-transparent to-transparent pointer-events-none" />
        )}
      </Card>
    );
  },
);

KPICard.displayName = "KPICard";
