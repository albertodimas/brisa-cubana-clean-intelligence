"use client";

import * as React from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/card";

export interface KPICardProps {
  /**
   * Etiqueta del KPI
   */
  label: string;
  /**
   * Valor del KPI (puede ser número o string)
   */
  value: string | number;
  /**
   * Descripción adicional
   */
  description?: string;
  /**
   * Icono del KPI
   */
  icon?: LucideIcon;
  /**
   * Sufijo del valor (%, USD, etc.)
   */
  suffix?: string;
  /**
   * Prefijo del valor ($, #, etc.)
   */
  prefix?: string;
  /**
   * Tendencia (up, down, neutral)
   */
  trend?: "up" | "down" | "neutral";
  /**
   * Valor de la tendencia
   */
  trendValue?: string;
  /**
   * Animar el contador numérico
   */
  animateNumber?: boolean;
  /**
   * Variante visual
   */
  variant?: "default" | "glass" | "elevated";
  /**
   * Clases adicionales
   */
  className?: string;
}

/**
 * Card de KPI con animaciones y contador numérico
 */
export function KPICard({
  label,
  value,
  description,
  icon: Icon,
  suffix = "",
  prefix = "",
  trend,
  trendValue,
  animateNumber = true,
  variant = "glass",
  className,
}: KPICardProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  // Animación de contador numérico
  const numericValue =
    typeof value === "number"
      ? value
      : parseFloat(value.toString().replace(/[^0-9.-]+/g, ""));
  const isNumeric = !isNaN(numericValue) && animateNumber;

  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const displayValue = useTransform(spring, (latest) => {
    if (!isNumeric) return value;
    return Math.round(latest).toLocaleString();
  });

  React.useEffect(() => {
    if (isInView && isNumeric) {
      spring.set(numericValue);
    }
  }, [isInView, numericValue, spring, isNumeric]);

  const trendIcons = {
    up: (
      <svg
        className="w-4 h-4 text-emerald-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        />
      </svg>
    ),
    down: (
      <svg
        className="w-4 h-4 text-red-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
        />
      </svg>
    ),
    neutral: (
      <svg
        className="w-4 h-4 text-brisa-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 12h14"
        />
      </svg>
    ),
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className={className}
    >
      <Card
        variant={variant}
        className="relative p-6 h-full overflow-hidden group hover:scale-[1.02] transition-transform duration-300"
      >
        {/* Icono de fondo decorativo */}
        {Icon && (
          <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Icon className="w-20 h-20 text-brisa-400" />
          </div>
        )}

        <div className="relative z-10 space-y-3">
          {/* Icono y etiqueta */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {Icon && (
                <div className="p-2 rounded-lg bg-brisa-700/20">
                  <Icon className="w-5 h-5 text-brisa-400" />
                </div>
              )}
              <span className="text-sm font-medium text-brisa-300">
                {label}
              </span>
            </div>

            {/* Tendencia */}
            {trend && trendValue && (
              <div className="flex items-center gap-1 text-xs">
                {trendIcons[trend]}
                <span
                  className={cn(
                    "font-semibold",
                    trend === "up" && "text-emerald-400",
                    trend === "down" && "text-red-400",
                    trend === "neutral" && "text-brisa-400",
                  )}
                >
                  {trendValue}
                </span>
              </div>
            )}
          </div>

          {/* Valor principal */}
          <div className="text-3xl sm:text-4xl font-bold text-brisa-50">
            {prefix}
            {isNumeric ? (
              <motion.span>{displayValue as any}</motion.span>
            ) : (
              value
            )}
            {suffix}
          </div>

          {/* Descripción */}
          {description && (
            <p className="text-sm text-brisa-400 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Efecto de brillo al hover */}
        <motion.div
          className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, rgba(126, 231, 196, 0.05), transparent 70%)",
          }}
          whileHover={{ opacity: 1 }}
        />
      </Card>
    </motion.div>
  );
}

export interface KPIGridProps {
  kpis: KPICardProps[];
  columns?: 2 | 3 | 4;
  className?: string;
}

/**
 * Grid de KPIs con animación escalonada
 */
export function KPIGrid({ kpis, columns = 4, className }: KPIGridProps) {
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-6", gridCols[columns], className)}>
      {kpis.map((kpi, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: idx * 0.1 }}
          viewport={{ once: true }}
        >
          <KPICard {...kpi} />
        </motion.div>
      ))}
    </div>
  );
}
