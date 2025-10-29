"use client";

import * as React from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/cn";

export interface CountUpProps {
  /**
   * Valor final del contador
   */
  end: number;
  /**
   * Valor inicial del contador
   * @default 0
   */
  start?: number;
  /**
   * Duración de la animación en segundos
   * @default 2
   */
  duration?: number;
  /**
   * Prefijo (ej: "$", "+" )
   */
  prefix?: string;
  /**
   * Sufijo (ej: "%", "K", "M")
   */
  suffix?: string;
  /**
   * Separador de miles
   * @default ","
   */
  separator?: string;
  /**
   * Decimales a mostrar
   * @default 0
   */
  decimals?: number;
  /**
   * Clases adicionales
   */
  className?: string;
  /**
   * Si true, anima solo una vez cuando entra al viewport
   * @default true
   */
  once?: boolean;
}

/**
 * Contador animado que cuenta desde un valor inicial hasta un valor final
 * Se activa cuando el elemento entra al viewport
 *
 * @example
 * ```tsx
 * <CountUp end={13000} suffix="+" duration={2} />
 * // Resultado: 0 → 13,000+
 *
 * <CountUp end={81} suffix="%" prefix="≈" />
 * // Resultado: ≈0% → ≈81%
 *
 * <CountUp end={4.5} decimals={1} />
 * // Resultado: 0.0 → 4.5
 * ```
 */
export function CountUp({
  end,
  start = 0,
  duration = 2,
  prefix = "",
  suffix = "",
  separator = ",",
  decimals = 0,
  className,
  once = true,
}: CountUpProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once, margin: "-100px" });

  const motionValue = useMotionValue(start);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
    mass: Math.max(duration / 2, 0.5),
  });

  const [displayValue, setDisplayValue] = React.useState(
    formatNumber(start, separator, decimals),
  );

  React.useEffect(() => {
    if (isInView) {
      motionValue.set(end);
    } else if (!once) {
      motionValue.set(start);
    }
  }, [isInView, end, start, motionValue, once]);

  React.useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayValue(formatNumber(latest, separator, decimals));
    });

    return () => unsubscribe();
  }, [springValue, separator, decimals]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}

/**
 * Formatea un número con separador de miles y decimales
 */
function formatNumber(
  value: number,
  separator: string,
  decimals: number,
): string {
  const fixed = value.toFixed(decimals);
  const [integer, decimal] = fixed.split(".");

  // Agregar separador de miles
  const withSeparator = integer.replace(/\B(?=(\d{3})+(?!\d))/g, separator);

  return decimals > 0 ? `${withSeparator}.${decimal}` : withSeparator;
}

/**
 * Componente KPI Card con count-up integrado
 */
export function KPICountUp({
  label,
  value,
  prefix,
  suffix,
  decimals = 0,
  trend,
  trendLabel,
  icon,
  className,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  const trendColors = {
    up: "text-emerald-400",
    down: "text-red-400",
    neutral: "text-brisa-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className={cn(
        "rounded-xl border border-brisa-600/20 bg-brisa-800/60 p-6 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-brisa-300">{label}</p>
          <p className="text-3xl font-bold text-brisa-50 tabular-nums">
            <CountUp
              end={value}
              prefix={prefix}
              suffix={suffix}
              decimals={decimals}
              duration={2.5}
            />
          </p>
          {trendLabel && trend && (
            <p className={cn("text-sm font-medium", trendColors[trend])}>
              {trend === "up" && "↑ "}
              {trend === "down" && "↓ "}
              {trendLabel}
            </p>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-brisa-700/30 p-3 text-brisa-300">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
